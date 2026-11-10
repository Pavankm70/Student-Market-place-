package com.campus.marketplace.entity;

public enum Category {
    BOOKS("Books"),
    ELECTRONICS("Electronics"),
    LAB_SUPPLIES("Lab Supplies"),
    STATIONERY("Stationery"),
    FURNITURE("Furniture"),
    CLOTHING("Clothing"),
    OTHER("Other");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
