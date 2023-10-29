resource "aws_s3_bucket" "apps_bucket" {
  bucket = "putte-platburk"

  versioning {
    enabled = true
  }
}


