package com.example.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nationalized
    @Column(nullable = false, length = 150)
    private String name;

    @Nationalized
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @PositiveOrZero
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @PositiveOrZero
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(length = 255)
    private String image;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
}
