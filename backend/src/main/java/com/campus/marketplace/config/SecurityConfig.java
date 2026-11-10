package com.campus.marketplace.config;

import com.campus.marketplace.security.CustomUserDetailsService;
import com.campus.marketplace.security.JwtAuthenticationEntryPoint;
import com.campus.marketplace.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthEntryPoint;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            CustomUserDetailsService userDetailsService,
            JwtAuthenticationEntryPoint jwtAuthEntryPoint,
            CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.jwtAuthEntryPoint = jwtAuthEntryPoint;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Pre-flight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public Health & status endpoints
                        .requestMatchers("/api/health/**", "/api/health", "/health", "/").permitAll()
                        // Public Auth endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // Public Razorpay Webhook endpoint
                        .requestMatchers("/api/orders/webhook").permitAll()
                        // Public External Book Lookup
                        .requestMatchers("/api/books/**").permitAll()
                        // Uploaded static assets
                        .requestMatchers("/uploads/**", "/api/uploads/**").permitAll()
                        // Real-time WebSocket Endpoint
                        .requestMatchers("/ws/**", "/ws").permitAll()
                        // Swagger & OpenAPI documentation
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        // Client-side SPA routes (allows browser refresh without 401 or 404)
                        .requestMatchers(HttpMethod.GET, "/", "/browse", "/login", "/register", "/sell", "/my-listings", "/wishlist", "/messages", "/profile", "/orders", "/seller/dashboard", "/admin", "/listings/**", "/products/**", "/index.html", "/favicon.svg", "/assets/**", "/*.html", "/*.js", "/*.css", "/*.svg").permitAll()
                        // Public browsing of reviews
                        .requestMatchers(HttpMethod.GET, "/api/reviews/listing/**", "/api/reviews/seller/**").permitAll()
                        // Super Admin endpoints (Enforce Super Admin access on backend)
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_SUPER_ADMIN")
                        // My Listings must be authenticated (comes before general GET listing pattern)
                        .requestMatchers("/api/listings/my").authenticated()
                        // Public browsing of listings & listing details
                        .requestMatchers(HttpMethod.GET, "/api/listings").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/listings/{id:[0-9]+}").permitAll()
                        // All other API requests require authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
