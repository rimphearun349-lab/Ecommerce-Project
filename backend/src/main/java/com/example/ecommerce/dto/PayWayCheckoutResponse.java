package com.example.ecommerce.dto;

import java.util.Map;

/** Everything the browser needs to POST the customer to ABA PayWay's hosted checkout page. */
public record PayWayCheckoutResponse(String actionUrl, Map<String, String> fields) {
}
