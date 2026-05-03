# Shared gcloud --format strings for listing resources.
# Projection syntax uses function-style calls: table(...), not table[...] (that triggers a parse error).

export GCLOUD_SCHEDULER_JOBS_LIST_FORMAT='table(name,schedule,state)'
