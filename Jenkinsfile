pipeline {
    agent any

    options {
        skipDefaultCheckout(true)  // Prevents Jenkins default SCM checkout
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
                sh '''
                echo "Building Docker image..."
                docker build -t ${ECR_REPO}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Login to AWS ECR') {
            steps {
                sh '''
                echo "Logging into AWS ECR..."
                aws ecr get-login-password --region ${AWS_REGION} | \
                docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
            }
        }

        stage('Tag & Push Image to ECR') {
            steps {
                sh '''
                echo "Tagging image..."
                docker tag ${ECR_REPO}:${IMAGE_TAG} \
                    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                echo "Pushing image..."
                docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                echo "Cleaning up local image..."
                docker rmi ${ECR_REPO}:${IMAGE_TAG} || true
                docker rmi ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} || true
                '''
            }
        }

        stage('Create New ECS Task Definition') {
            steps {
                sh '''
                echo "Fetching current task definition..."

                aws ecs describe-task-definition \
                    --task-definition ${TASK_FAMILY} \
                    --region ${AWS_REGION} \
                    --query taskDefinition > task-def.json

                NEW_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
                echo "Updating container image to $NEW_IMAGE"

                cat task-def.json | jq \
                --arg IMAGE "$NEW_IMAGE" \
                --arg NAME "${CONTAINER_NAME}" \
                '
                .containerDefinitions |= map(
                    if .name == $NAME then .image = $IMAGE else . end
                ) |
                del(
                    .taskDefinitionArn,
                    .revision,
                    .status,
                    .requiresAttributes,
                    .compatibilities,
                    .registeredAt,
                    .registeredBy
                )
                ' > new-task-def.json

                echo "Registering new task definition..."

                NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
                    --cli-input-json file://new-task-def.json \
                    --region ${AWS_REGION} \
                    --query "taskDefinition.taskDefinitionArn" \
                    --output text)

                echo "New Task Definition ARN: $NEW_TASK_DEF_ARN"
                echo $NEW_TASK_DEF_ARN > taskdef_arn.txt
                '''
            }
        }

        stage('Deploy to ECS Service') {
            steps {
                sh '''
                echo "Deploying to ECS..."

                TASK_DEF_ARN=$(cat taskdef_arn.txt)

                aws ecs update-service \
                    --cluster ${CLUSTER_NAME} \
                    --service ${SERVICE_NAME} \
                    --task-definition $TASK_DEF_ARN \
                    --force-new-deployment \
                    --region ${AWS_REGION}

                echo "Waiting for service to stabilize..."

                aws ecs wait services-stable \
                    --cluster ${CLUSTER_NAME} \
                    --services ${SERVICE_NAME} \
                    --region ${AWS_REGION}

                echo "Deployment completed successfully!"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline SUCCESS - Image ${env.IMAGE_TAG} deployed to ECS"
        }
        failure {
            echo "Pipeline FAILED - Check logs above"
        }
        always {
            sh '''
            rm -f task-def.json new-task-def.json taskdef_arn.txt || true
            '''
        }
    }
}