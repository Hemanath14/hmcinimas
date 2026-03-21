pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        AWS_ACCOUNT_ID = "880147167760"
        AWS_REGION     = "us-east-1"
        ECR_REPO       = "hm-cini"
        CLUSTER_NAME   = "hm-mini-cluster"
        SERVICE_NAME   = "hm-cini-task-service-inbi73je"
        TASK_FAMILY    = "hm-cini-task"
        CONTAINER_NAME = "hm-cini-container"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Hemanath14/hmcinimas.git'
            }
        }

        stage('Set Image Tag') {
            steps {
                script {
                    env.IMAGE_TAG = env.BUILD_NUMBER
                    echo "Using IMAGE_TAG=${env.IMAGE_TAG}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
            }
        }

        stage('Login to AWS ECR') {
            steps {
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
            }
        }

        stage('Tag and Push Image to ECR') {
            steps {
                sh "docker tag ${ECR_REPO}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
                sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
            }
        }

        stage('Create New ECS Task Definition') {
            steps {
                sh """
                aws ecs describe-task-definition \
                    --task-definition ${TASK_FAMILY} \
                    --region ${AWS_REGION} \
                    --query taskDefinition > task-def.json

                cat task-def.json | jq \
                    --arg IMAGE "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}" \
                    --arg NAME "${CONTAINER_NAME}" \
                    '.containerDefinitions |= map(if .name == \$NAME then .image = \$IMAGE else . end) | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
                    > new-task-def.json

                NEW_TASK_DEF_ARN=\$(aws ecs register-task-definition \
                    --cli-input-json file://new-task-def.json \
                    --region ${AWS_REGION} \
                    --query "taskDefinition.taskDefinitionArn" \
                    --output text)

                echo \$NEW_TASK_DEF_ARN > taskdef_arn.txt
                echo "Registered: \$NEW_TASK_DEF_ARN"
                """
            }
        }

        stage('Deploy to ECS Service') {
            steps {
                sh """
                TASK_DEF_ARN=\$(cat taskdef_arn.txt)

                aws ecs update-service \
                    --cluster ${CLUSTER_NAME} \
                    --service ${SERVICE_NAME} \
                    --task-definition \$TASK_DEF_ARN \
                    --force-new-deployment \
                    --region ${AWS_REGION}

                echo "Deployment triggered successfully"
                """
            }
        }
    }

    post {
        success {
            echo "SUCCESS - Image ${env.IMAGE_TAG} deployed"
        }
        failure {
            echo "FAILED - Check logs above"
        }
        always {
            sh "rm -f task-def.json new-task-def.json taskdef_arn.txt || true"
        }
    }
}