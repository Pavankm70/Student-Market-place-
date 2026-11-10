package com.campus.marketplace.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to forward Single Page Application (SPA) client routes to /index.html.
 * Ensures refreshing on routes like /browse, /login, /register, etc. never yields a 404.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/browse",
            "/login",
            "/register",
            "/sell",
            "/my-listings",
            "/wishlist",
            "/messages",
            "/profile",
            "/listings/{id:[0-9]+}",
            "/listings/{id:[0-9]+}/edit"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
