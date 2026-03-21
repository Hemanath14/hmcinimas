pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '880147167760'
        ECR_REPO = 'hm-cini'
        IMAGE_TAG = "${BUILD_NUMBER}"
        LOCAL_IMAGE = 'hmcinimas-app'
        ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
        JAVA_HOME = "/usr/lib/jvm/java-21-openjdk-amd64"
        PATH = "/usr/lib/jvm/java-21-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/Hemanath14/hmcinimas.git'
            }
        }

        stage('Build Application') {
            steps {
                sh '''
                    chmod +x mvnw
                    ./mvnw clean compile
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh './mvnw test'
            }
        }

        stage('Package Application') {
            steps {
                sh './mvnw package -DskipTests'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${LOCAL_IMAGE}:${IMAGE_TAG} .'
            }
        }

        stage('Configure AWS Credentials') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=${AWS_REGION}
                    '''
                }
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
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
                sh '''
                    aws ecs update-service \
                      --cluster hm-cini-cluster \
                      --service hm-cini-service \
                      --force-new-deployment \
                      --region ${AWS_REGION}
                '''
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
            echo 'Pipeline failed'
        }
    }
}