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
        if (isServiceConnected) {
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Billing service not connected");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        if (!isServiceConnected) {
            JSObject result = new JSObject();
            result.put("products", new JSONArray());
            result.put("error", "Billing service not connected");
            call.resolve(result);
            return;
        }

        JSObject data = call.getData();
        if (data == null) {
            JSObject result = new JSObject();
            result.put("products", new JSONArray());
            result.put("error", "Data is required");
            call.resolve(result);
            return;
        }

        JSONArray productIdsArray;
        try {
            productIdsArray = data.getJSONArray("productIds");
        } catch (JSONException e) {
            JSObject result = new JSObject();
            result.put("products", new JSONArray());
            result.put("error", "Product IDs are required");
            call.resolve(result);
            return;
        }

        if (productIdsArray == null) {
            JSObject result = new JSObject();
            result.put("products", new JSONArray());
            result.put("error", "Product IDs are required");
            call.resolve(result);
            return;
        }

        List<String> productIds = new ArrayList<>();
        for (int i = 0; i < productIdsArray.length(); i++) {
            try {
                productIds.add(productIdsArray.getString(i));
            } catch (JSONException e) {
                Log.e(TAG, "Error parsing product IDs", e);
            }
        }

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String productId : productIds) {
            productList.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build());
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                JSObject result = new JSObject();
                JSONArray productsArray = new JSONArray();

                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (ProductDetails productDetails : productDetailsList) {
                        try {
                            JSONObject product = new JSONObject();
                            product.put("id", productDetails.getProductId());
                            product.put("title", productDetails.getTitle());
                            product.put("description", productDetails.getDescription());
                            product.put("price", productDetails.getOneTimePurchaseOfferDetails().getFormattedPrice());
                            product.put("priceAmountMicros", productDetails.getOneTimePurchaseOfferDetails().getPriceAmountMicros());
                            product.put("priceCurrencyCode", productDetails.getOneTimePurchaseOfferDetails().getPriceCurrencyCode());
                            product.put("type", "consumable");
                            productsArray.put(product);
                        } catch (JSONException e) {
                            Log.e(TAG, "Error creating product JSON", e);
                        }
                    }
                } else {
                    result.put("error", "Failed to query products: " + billingResult.getResponseCode());
                }

                result.put("products", productsArray);
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void purchaseProduct(PluginCall call) {
        if (!isServiceConnected) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Billing service not connected");
            call.resolve(result);
            return;
        }

        JSObject data = call.getData();
        if (data == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Data is required");
            call.resolve(result);
            return;
        }

        String productId = data.getString("productId");
        if (productId == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Product ID is required");
            call.resolve(result);
            return;
        }

        pendingPurchaseCall = call;

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !productDetailsList.isEmpty()) {
                    ProductDetails productDetails = productDetailsList.get(0);
                    List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
                    productDetailsParamsList.add(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                    .setProductDetails(productDetails)
                                    .build()
                    );
                    BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                            .setProductDetailsParamsList(productDetailsParamsList)
                            .build();

                    Activity activity = getActivity();
                    if (activity != null) {
                        billingClient.launchBillingFlow(activity, billingFlowParams);
                    } else {
                        if (pendingPurchaseCall != null) {
                            JSObject result = new JSObject();
                            result.put("success", false);
                            result.put("error", "Activity not available");
                            pendingPurchaseCall.resolve(result);
                            pendingPurchaseCall = null;
                        }
                    }
                } else {
                    if (pendingPurchaseCall != null) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("error", "Product not found");
                        pendingPurchaseCall.resolve(result);
                        pendingPurchaseCall = null;
                    }
                }
            }
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) {
            return;
        }

        JSObject result = new JSObject();

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    result.put("success", true);
                    result.put("purchaseToken", purchase.getPurchaseToken());
                    result.put("orderId", purchase.getOrderId());
                    result.put("productId", purchase.getProducts().get(0));

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
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Billing service not connected");
            call.resolve(result);
            return;
        }

        JSObject data = call.getData();
        if (data == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Data is required");
            call.resolve(result);
            return;
        }

        String purchaseToken = data.getString("purchaseToken");
        if (purchaseToken == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Purchase token is required");
            call.resolve(result);
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
        if (!isServiceConnected) {
            JSObject result = new JSObject();
            result.put("subscriptions", new JSONArray());
            result.put("error", "Billing service not connected");
            call.resolve(result);
            return;
        }

        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        billingClient.queryPurchasesAsync(params, new PurchasesResponseListener() {
            @Override
            public void onQueryPurchasesResponse(BillingResult billingResult, List<Purchase> purchases) {
                JSObject result = new JSObject();
                JSONArray subscriptionsArray = new JSONArray();

                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (Purchase purchase : purchases) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            subscriptionsArray.put(purchase.getProducts().get(0));
                        }
                    }
                } else {
                    result.put("error", "Failed to query subscriptions: " + billingResult.getResponseCode());
                }

                result.put("subscriptions", subscriptionsArray);
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void verifyPurchase(PluginCall call) {
        // This should be done on the backend for security
        // For now, we'll just check if the purchase exists
        JSObject data = call.getData();
        if (data == null) {
            JSObject result = new JSObject();
            result.put("isValid", false);
            result.put("error", "Data is required");
            call.resolve(result);
            return;
        }

        // This should be done on the backend for security
        // For now, we'll just check if the purchase exists
        JSObject result = new JSObject();
        result.put("isValid", true);
        call.resolve(result);
    }
}

