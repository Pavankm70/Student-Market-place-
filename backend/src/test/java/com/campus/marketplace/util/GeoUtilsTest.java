package com.campus.marketplace.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeoUtilsTest {

    @Test
    @DisplayName("Haversine calculates accurate distance between NMIT Yelahanka and Hebbal")
    void testDistanceBetweenNmitAndHebbal() {
        // NMIT Yelahanka coordinates: ~13.1287, 77.5873
        // Hebbal Bengaluru coordinates: ~13.0358, 77.5970
        Double distanceKm = GeoUtils.calculateDistanceKm(13.1287, 77.5873, 13.0358, 77.5970);

        assertNotNull(distanceKm);
        // Straight line distance is approximately 10.3 - 10.5 km
        assertTrue(distanceKm >= 10.0 && distanceKm <= 11.0,
                "Expected distance between NMIT and Hebbal to be ~10.3 km, got: " + distanceKm);
    }

    @Test
    @DisplayName("Distance between identical coordinates is 0.0 km")
    void testIdenticalCoordinatesReturnZeroDistance() {
        Double distance = GeoUtils.calculateDistanceKm(13.1287, 77.5873, 13.1287, 77.5873);
        assertNotNull(distance);
        assertEquals(0.0, distance, 0.01);
    }

    @Test
    @DisplayName("Gracefully returns null when either latitude or longitude is null")
    void testNullCoordinatesReturnNullGracefully() {
        assertNull(GeoUtils.calculateDistanceKm(null, 77.5873, 13.0358, 77.5970));
        assertNull(GeoUtils.calculateDistanceKm(13.1287, null, 13.0358, 77.5970));
        assertNull(GeoUtils.calculateDistanceKm(13.1287, 77.5873, null, 77.5970));
        assertNull(GeoUtils.calculateDistanceKm(13.1287, 77.5873, 13.0358, null));
    }

    @Test
    @DisplayName("Rejects invalid latitude (> 90 or < -90) and longitude (> 180 or < -180)")
    void testCoordinateValidation() {
        assertFalse(GeoUtils.isValidCoordinate(95.0, 77.0));
        assertFalse(GeoUtils.isValidCoordinate(-95.0, 77.0));
        assertFalse(GeoUtils.isValidCoordinate(13.0, 185.0));
        assertFalse(GeoUtils.isValidCoordinate(13.0, -185.0));
        assertTrue(GeoUtils.isValidCoordinate(13.1287, 77.5873));
    }
}
