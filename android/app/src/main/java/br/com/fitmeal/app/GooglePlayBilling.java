package br.com.fitmeal.app;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBilling extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "GooglePlayBilling";
    private BillingClient billingClient;
    private boolean isServiceConnected = false;
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        super.load();
        initializeBillingClient();
    }

    private void initializeBillingClient() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isServiceConnected = true;
                    Log.d(TAG, "Billing client connected");
                } else {
                    Log.e(TAG, "Billing client connection failed: " + billingResult.getResponseCode());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isServiceConnected = false;
                Log.d(TAG, "Billing client disconnected");
            }
        });
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            if (billingClient == null) {
                initializeBillingClient();
            }

            if (isServiceConnected) {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                // Se não estiver conectado, tenta conectar e retorna o status atual
                // O listener de conexão cuidará de atualizar isServiceConnected
                billingClient.startConnection(new BillingClientStateListener() {
                    @Override
                    public void onBillingSetupFinished(BillingResult billingResult) {
                        JSObject result = new JSObject();
                        if (billingResult != null && billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            isServiceConnected = true;
                            result.put("success", true);
                        } else {
                            isServiceConnected = false;
                            result.put("success", false);
                            result.put("error", "Billing service connection failed");
                        }
                        call.resolve(result);
                    }

                    @Override
                    public void onBillingServiceDisconnected() {
                        isServiceConnected = false;
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception in initialize", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        try {
            if (!isServiceConnected || billingClient == null) {
                JSObject result = new JSObject();
                result.put("products", new JSONArray());
                result.put("error", "Billing service not connected");
                call.resolve(result);
                return;
            }

            JSObject data = call.getData();
            if (data == null || (!data.has("products") && !data.has("productIds"))) {
                JSObject result = new JSObject();
                result.put("products", new JSONArray());
                call.resolve(result);
                return;
            }

            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();

            // Check for new format with types
            if (data.has("products")) {
                try {
                    JSONArray productsArray = data.getJSONArray("products");
                    if (productsArray != null) {
                        for (int i = 0; i < productsArray.length(); i++) {
                            JSONObject product = productsArray.getJSONObject(i);
                            if (product != null) {
                                String id = product.optString("id");
                                String type = product.optString("type", "inapp");
                                
                                if (id != null && !id.isEmpty()) {
                                    String productType = type.equals("subscription") ? 
                                            BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;

                                    productList.add(QueryProductDetailsParams.Product.newBuilder()
                                            .setProductId(id)
                                            .setProductType(productType)
                                            .build());
                                }
                            }
                        }
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing products array", e);
                }
            } 
            // Fallback to old format
            else if (data.has("productIds")) {
                try {
                    JSONArray productIdsArray = data.getJSONArray("productIds");
                    if (productIdsArray != null) {
                        for (int i = 0; i < productIdsArray.length(); i++) {
                            String id = productIdsArray.optString(i);
                            if (id != null && !id.isEmpty()) {
                                productList.add(QueryProductDetailsParams.Product.newBuilder()
                                        .setProductId(id)
                                        .setProductType(BillingClient.ProductType.INAPP)
                                        .build());
                            }
                        }
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing product IDs", e);
                }
            }

            if (productList.isEmpty()) {
                JSObject result = new JSObject();
                result.put("products", new JSONArray());
                call.resolve(result);
                return;
            }

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
                @Override
                public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                    JSObject result = new JSObject();
                    JSONArray productsArray = new JSONArray();

                    try {
                        if (billingResult != null && billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null) {
                            for (ProductDetails productDetails : productDetailsList) {
                                if (productDetails == null) continue;
                                
                                try {
                                    JSONObject product = new JSONObject();
                                    product.put("id", productDetails.getProductId());
                                    product.put("title", productDetails.getTitle());
                                    product.put("description", productDetails.getDescription());
                                    
                                    if (productDetails.getProductType().equals(BillingClient.ProductType.SUBS)) {
                                        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
                                        if (offers != null && !offers.isEmpty()) {
                                            ProductDetails.SubscriptionOfferDetails offer = offers.get(0);
                                            if (offer != null && offer.getPricingPhases() != null) {
                                                List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                                                if (phases != null && !phases.isEmpty()) {
                                                    ProductDetails.PricingPhase pricingPhase = phases.get(0);
                                                    if (pricingPhase != null) {
                                                        product.put("price", pricingPhase.getFormattedPrice());
                                                        product.put("priceAmountMicros", pricingPhase.getPriceAmountMicros());
                                                        product.put("priceCurrencyCode", pricingPhase.getPriceCurrencyCode());
                                                        product.put("type", "subscription");
                                                        productsArray.put(product);
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        ProductDetails.OneTimePurchaseOfferDetails oneTimeOffer = productDetails.getOneTimePurchaseOfferDetails();
                                        if (oneTimeOffer != null) {
                                            product.put("price", oneTimeOffer.getFormattedPrice());
                                            product.put("priceAmountMicros", oneTimeOffer.getPriceAmountMicros());
                                            product.put("priceCurrencyCode", oneTimeOffer.getPriceCurrencyCode());
                                            product.put("type", "consumable");
                                            productsArray.put(product);
                                        }
                                    }
                                } catch (Exception e) {
                                    Log.e(TAG, "Error processing individual product", e);
                                }
                            }
                        } else {
                            String code = billingResult != null ? String.valueOf(billingResult.getResponseCode()) : "null";
                            result.put("error", "Failed to query products: " + code);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error in product details response callback", e);
                        result.put("error", "Error processing products: " + e.getMessage());
                    }

                    result.put("products", productsArray);
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Exception in getProducts", e);
            JSObject result = new JSObject();
            result.put("products", new JSONArray());
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void purchaseProduct(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing service not connected");
            return;
        }

        JSObject data = call.getData();
        String productId = data.getString("productId");
        String type = data.getString("type"); // "consumable" or "subscription"
        
        if (productId == null) {
            call.reject("Product ID is required");
            return;
        }

        pendingPurchaseCall = call;

        String productType = (type != null && type.equals("subscription")) ? 
                BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(productType)
                .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !productDetailsList.isEmpty()) {
                    ProductDetails productDetails = productDetailsList.get(0);
                    
                    BillingFlowParams.Builder billingFlowParamsBuilder = BillingFlowParams.newBuilder();
                    
                    List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
                    
                    BillingFlowParams.ProductDetailsParams.Builder paramsBuilder = BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(productDetails);
                            
                    if (productType.equals(BillingClient.ProductType.SUBS)) {
                        // For subscriptions, we need an offer token
                        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
                        if (offers != null && !offers.isEmpty()) {
                            paramsBuilder.setOfferToken(offers.get(0).getOfferToken());
                        }
                    }
                    
                    productDetailsParamsList.add(paramsBuilder.build());
                    
                    billingFlowParamsBuilder.setProductDetailsParamsList(productDetailsParamsList);

                    Activity activity = getActivity();
                    if (activity != null) {
                        billingClient.launchBillingFlow(activity, billingFlowParamsBuilder.build());
                    } else {
                        if (pendingPurchaseCall != null) {
                            pendingPurchaseCall.reject("Activity not available");
                            pendingPurchaseCall = null;
                        }
                    }
                } else {
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.reject("Product not found");
                        pendingPurchaseCall = null;
                    }
                }
            }
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) {
            // If no pending call, we might still want to process purchases (e.g. deferred)
            // But for now we just return
            return;
        }

        JSObject result = new JSObject();

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    result.put("success", true);
                    result.put("purchaseToken", purchase.getPurchaseToken());
                    result.put("orderId", purchase.getOrderId());
                    
                    List<String> products = purchase.getProducts();
                    if (products != null && !products.isEmpty()) {
                        result.put("productId", products.get(0));
                    } else {
                        result.put("productId", "");
                    }

                    // Acknowledge purchase if needed
                    if (!purchase.isAcknowledged()) {
                        AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();

                        billingClient.acknowledgePurchase(acknowledgePurchaseParams, new AcknowledgePurchaseResponseListener() {
                            @Override
                            public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
                                Log.d(TAG, "Purchase acknowledged: " + billingResult.getResponseCode());
                            }
                        });
                    }

                    pendingPurchaseCall.resolve(result);
                    pendingPurchaseCall = null;
                    return;
                }
            }
        }

        result.put("success", false);
        result.put("error", "Purchase failed: " + billingResult.getResponseCode());
        pendingPurchaseCall.resolve(result);
        pendingPurchaseCall = null;
    }

    @PluginMethod
    public void consumePurchase(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing service not connected");
            return;
        }

        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null) {
            call.reject("Purchase token is required");
            return;
        }

        ConsumeParams consumeParams = ConsumeParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build();

        billingClient.consumeAsync(consumeParams, new ConsumeResponseListener() {
            @Override
            public void onConsumeResponse(BillingResult billingResult, String purchaseToken) {
                JSObject result = new JSObject();
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    result.put("success", true);
                } else {
                    result.put("success", false);
                    result.put("error", "Failed to consume purchase: " + billingResult.getResponseCode());
                }
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void getActiveSubscriptions(PluginCall call) {
        queryPurchasesInternal(call, BillingClient.ProductType.SUBS);
    }
    
    @PluginMethod
    public void queryPurchases(PluginCall call) {
        String type = call.getString("type", "inapp");
        String productType = type.equals("subscription") ? 
                BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;
        
        queryPurchasesInternal(call, productType);
    }

    private void queryPurchasesInternal(PluginCall call, String productType) {
        try {
            if (!isServiceConnected || billingClient == null) {
                JSObject result = new JSObject();
                result.put("purchases", new JSONArray());
                result.put("error", "Billing service not connected");
                call.resolve(result);
                return;
            }

            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                    .setProductType(productType)
                    .build();

            billingClient.queryPurchasesAsync(params, new PurchasesResponseListener() {
                @Override
                public void onQueryPurchasesResponse(BillingResult billingResult, List<Purchase> purchases) {
                    JSObject result = new JSObject();
                    JSONArray purchasesArray = new JSONArray();

                    try {
                        if (billingResult != null && billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                            for (Purchase purchase : purchases) {
                                if (purchase != null && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                    try {
                                        JSONObject p = new JSONObject();
                                        List<String> products = purchase.getProducts();
                                        if (products != null && !products.isEmpty()) {
                                            p.put("productId", products.get(0));
                                        } else {
                                            p.put("productId", "");
                                        }
                                        p.put("purchaseToken", purchase.getPurchaseToken());
                                        p.put("orderId", purchase.getOrderId());
                                        p.put("isAcknowledged", purchase.isAcknowledged());
                                        purchasesArray.put(p);
                                    } catch (JSONException e) {
                                        Log.e(TAG, "Error creating purchase JSON", e);
                                    }
                                }
                            }
                        } else {
                            String code = billingResult != null ? String.valueOf(billingResult.getResponseCode()) : "null";
                            result.put("error", "Failed to query purchases: " + code);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error in query purchases callback", e);
                        result.put("error", "Error processing purchases: " + e.getMessage());
                    }

                    result.put("purchases", purchasesArray);
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Exception in queryPurchasesInternal", e);
            JSObject result = new JSObject();
            result.put("purchases", new JSONArray());
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void verifyPurchase(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isValid", true);
        call.resolve(result);
    }
}
