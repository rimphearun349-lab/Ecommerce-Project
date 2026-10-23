package com.example.ecommerce.dto;

import java.math.BigDecimal;

/** A real KHQR code from ABA PayWay for one order. qrImage is a "data:image/png;base64,..." picture. */
public record KhqrResponse(
        String qrImage,
        String qrString,
        String deeplink,
        BigDecimal amount,
        String currency,
        String tranId,
        int lifetimeMinutes
) {
}