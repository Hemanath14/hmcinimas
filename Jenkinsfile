pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = '880147167760.dkr.ecr.us-east-1.amazonaws.com/hm-cini'
        IMAGE_TAG = 'latest'
        LOCAL_IMAGE = 'hmcinimas-app'
        CONTAINER_NAME = 'hmcinimas-app'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'github-creds', url: 'https://github.com/Hemanath14/hmcinimas.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $LOCAL_IMAGE:$IMAGE_TAG .'
            }
        }

        stage('Configure AWS Credentials') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws configure set default.region $AWS_REGION
                    '''
                }
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region $AWS_REGION | \
                    docker login --username AWS --password-stdin $ECR_REPO
                '''
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh 'docker tag $LOCAL_IMAGE:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG'
            }
        }

        stage('Push Docker Image to ECR') {
            steps {
                sh 'docker push $ECR_REPO:$IMAGE_TAG'
            }
        }
    }

    post {
        always {
            sh 'docker logout 880147167760.dkr.ecr.us-east-1.amazonaws.com || true'
        }
        success {
            echo 'Image pushed to ECR successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}