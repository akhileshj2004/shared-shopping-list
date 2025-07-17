// Jenkinsfile
pipeline {
    agent any

    environment {
        ANSIBLE_INVENTORY_VM_IP = '172.16.52.41'
        ANSIBLE_VM_SSH_USER = 'atharv'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out code..."
                // Ensure this ID matches the one you created in Jenkins
                git credentialsId: 'github-credentials', url: 'https://github.com/a-t-h-a-r-v/shared-shopping-list.git'
            }
        }

        stage('Install Ansible Dependencies on Agent') {
            steps {
                echo "Installing Ansible and community.docker collection on agent..."
                sh 'pip install --user ansible'
                sh 'ansible-galaxy collection install community.docker'
            }
        }

        stage('Run Ansible Deployment') {
            steps {
                echo "Starting Ansible deployment playbook..."
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'debian-vm-key', keyFileVariable: 'ANSIBLE_SSH_KEY_FILE'),
                    string(credentialsId: 'ansible-vault-password', variable: 'ANSIBLE_VAULT_PASS')
                ]) {
                    sshagent(credentials: ['debian-vm-key']) {
                        sh """
                            echo "[webservers]" > ansible/jenkins_inventory.ini
                            echo "${ANSIBLE_INVENTORY_VM_IP} ansible_user=${ANSIBLE_VM_SSH_USER} ansible_ssh_private_key_file=${ANSIBLE_SSH_KEY_FILE}" >> ansible/jenkins_inventory.ini
                            chmod 600 ansible/jenkins_inventory.ini # Secure permissions for the inventory file
                        """
                        echo "Executing ansible-playbook deploy.yml..."
                        sh "ansible-playbook ansible/deploy.yml -i ansible/jenkins_inventory.ini --vault-password-file <(echo ${ANSIBLE_VAULT_PASS})"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up Jenkins workspace."
            cleanWs()
        }
        success {
            echo "Pipeline finished successfully! Application deployed via Ansible."
        }
        failure {
            echo "Pipeline failed! Check Jenkins build logs for errors."
        }
    }
}
