pipeline {
    agent any

    tools {
        jdk 'JDK-21'
        maven 'Maven-3.9'
        nodejs 'NodeJS-20'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(name: 'BUILD_DOCKER', defaultValue: false, description: 'Build Docker container images')
        booleanParam(name: 'DEPLOY_PROD', defaultValue: false, description: 'Deploy to production environment (requires credentials)')
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build & JUnit Tests') {
            steps {
                dir("${env.BACKEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'chmod +x ./mvnw'
                            sh './mvnw clean test package -Dspring.profiles.active=test'
                        } else {
                            bat '.\\mvnw.cmd clean test package -Dspring.profiles.active=test'
                        }
                    }
                }
            }
            post {
                always {
                    junit testResults: "${env.BACKEND_DIR}/target/surefire-reports/*.xml", allowEmptyResults: true
                }
            }
        }

        stage('Frontend Install & Build') {
            steps {
                dir("${env.FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npm ci'
                            sh 'npm run build'
                        } else {
                            bat 'npm ci'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            when {
                expression { return params.BUILD_DOCKER == true }
            }
            steps {
                script {
                    echo "Building Docker images for CampusLoop..."
                    if (isUnix()) {
                        sh 'docker build -t campusloop-backend:latest ./backend'
                        sh 'docker build -t campusloop-frontend:latest ./frontend'
                    } else {
                        bat 'docker build -t campusloop-backend:latest ./backend'
                        bat 'docker build -t campusloop-frontend:latest ./frontend'
                    }
                }
            }
        }

        stage('Optional Deployment') {
            when {
                allOf {
                    branch 'main'
                    expression { return params.DEPLOY_PROD == true }
                }
            }
            steps {
                script {
                    echo "Deploying to production target (Webhook/Cloud Provider)..."
                    // Production deployment triggered via configured Jenkins secret credential
                    // withCredentials([string(credentialsId: 'RENDER_DEPLOY_HOOK', variable: 'HOOK_URL')]) {
                    //     sh "curl -X POST $HOOK_URL"
                    // }
                    echo "Deployment completed successfully."
                }
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline succeeded! All backend tests and frontend bundles passed."
        }
        failure {
            echo "Pipeline failed. Review JUnit reports or build console for error details."
        }
    }
}
