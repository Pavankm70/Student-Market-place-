package com.campus.marketplace.util;

public final class GeoUtils {

    public static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {
        // Utility class
    }

    /**
     * Calculates the great-circle distance between two points on the Earth's surface
     * using the Haversine formula.
     *
     * @param lat1 Latitude of point 1 in degrees
     * @param lon1 Longitude of point 1 in degrees
     * @param lat2 Latitude of point 2 in degrees
     * @param lon2 Longitude of point 2 in degrees
     * @return Straight-line distance in kilometers, or null if any coordinate is missing/invalid
     */
    public static Double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
            return null;
        }

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        // Round to 2 decimal places for clean UI presentation
        return Math.round(distance * 100.0) / 100.0;
    }

    public static boolean isValidCoordinate(Double lat, Double lon) {
        return lat != null && lon != null
                && lat >= -90.0 && lat <= 90.0
                && lon >= -180.0 && lon <= 180.0;
    }
}
