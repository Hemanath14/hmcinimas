pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '880147167760'
        ECR_REPO = 'hm-cini'
        IMAGE_TAG = "${BUILD_NUMBER}"
        LOCAL_IMAGE = 'hmcinimas-app'
        ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/Hemanath14/hmcinimas.git'
            }
        }

        stage('Build & Test (Dockerized Maven)') {
            steps {
                sh '''
                    docker run --rm \
                      -u $(id -u):$(id -g) \
                      -v $(pwd):/app \
                      -w /app \
                      maven:3.9.9-eclipse-temurin-17 \
                      mvn clean package
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${LOCAL_IMAGE}:${IMAGE_TAG} .'
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=${AWS_REGION}

                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    '''
                }
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh '''
                    docker tag ${LOCAL_IMAGE}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
                    docker tag ${LOCAL_IMAGE}:${IMAGE_TAG} ${ECR_URI}:latest
                '''
            }
        }

        stage('Push Docker Image to ECR') {
            steps {
                sh '''
                    docker push ${ECR_URI}:${IMAGE_TAG}
                    docker push ${ECR_URI}:latest
                '''
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=${AWS_REGION}

                        aws ecs update-service \
                          --cluster hm-mini-cluster \
                          --service hm-cini-task-service-inbi73je \
                          --force-new-deployment \
                          --region ${AWS_REGION}
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com || true'
        }
        success {
            echo 'CI/CD Pipeline completed successfully '
        }
        failure {
            echo 'Pipeline failed '
        }
    }
}