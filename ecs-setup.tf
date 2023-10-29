locals {
  execution_role_id = aws_iam_role.execution.id
  task_role_id      = aws_iam_role.task.id
  // We need the ARN for the task definition.
  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn      = aws_iam_role.task.arn
}

resource "aws_kms_key" "lapp-kms-key" {
  description             = "Some sort of key"
  deletion_window_in_days = 7
}

resource "aws_cloudwatch_log_group" "lapp-log-grp" {
  name = "lapp-log-grp"
}

resource "aws_ecs_cluster" "lapp-cluster" {
  name = "lapp-cluster"

  configuration {
    execute_command_configuration {
      kms_key_id = aws_kms_key.lapp-kms-key.arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.lapp-log-grp.name
      }
    }
  }
}

// Create the task role if create_task_role=true
resource "aws_iam_role" "task" {
  path = var.ecs_iam_role_path

  name = "ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "task" {
  name        = "ecs-task"
  path        = var.ecs_iam_role_path
  description = "ecs mesh-task task policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:GetRole"
      ],
      "Resource": [
        "${local.task_role_arn}"
      ]
    }
  ]
}
EOF
}

// Create the execution role if var.create_execution_role=true
resource "aws_iam_role" "execution" {
  name = "ecs-execution"
  path = var.ecs_iam_role_path

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

// Only create and attach this policy if var.create_execution_role=true
resource "aws_iam_policy" "execution" {
  name        = "ecs-execution"
  path        = var.ecs_iam_role_path
  description = "ecs mesh-task execution policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
          "autoscaling:Describe*",
          "ec2:DescribeTags",
          "cloudformation:DescribeStack*",
          "ec2:Describe*",
          "ecs:CreateCluster",
          "ecs:DeregisterContainerInstance",
          "ecs:DiscoverPollEndpoint",
          "ecs:Poll",
          "ecs:RegisterContainerInstance",
          "ecs:StartTelemetrySession",
          "ecs:UpdateContainerInstancesState",
          "ecs:Submit*",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
        "Effect": "Allow",
        "Action": "ecs:TagResource",
        "Resource": "*",
        "Condition": {
            "StringEquals": {
                "ecs:CreateAction": [
                    "CreateCluster",
                    "RegisterContainerInstance"
                ]
            }
        }
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "ecs_auto_discover_cluster" {
  name   = "ecs-auto-discover-cluster"
  role   = aws_iam_policy.task.name
  policy = data.aws_iam_policy_document.auto_discover_cluster.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = local.execution_role_id
  policy_arn = aws_iam_policy.execution.arn
}

// Only attach extra policies if create_execution_role=true.
// We have a validation to ensure additional_execution_role_policies can only
// be passed when var.create_execution_role=true.
# resource "aws_iam_role_policy_attachment" "additional_execution_policies" {
#   role       = local.execution_role_id
#   policy_arn = var.additional_execution_role_policies[count.index]
# }

data "aws_iam_policy_document" "auto_discover_cluster" {
  statement {
    effect = "Allow"

    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeTags",
      "autoscaling:DescribeAutoScalingGroups",
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = ["arn:aws:s3:::putte-platburk"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::putte-platburk"]
  }
}
