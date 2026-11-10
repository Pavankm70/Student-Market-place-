# Multi-stage build for Spring Boot backend

# Stage 1: Build the application JAR with Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build jar without running tests
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create upload directory for user listing images
RUN mkdir -p /app/uploads

# Copy packaged jar from builder stage
COPY --from=builder /app/target/campus-marketplace-*.jar app.jar

# Environment defaults
ENV PORT=8080
ENV UPLOAD_DIR=/app/uploads

EXPOSE 8080

# Launch application with container-aware memory allocation and Render dynamic port support
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]
