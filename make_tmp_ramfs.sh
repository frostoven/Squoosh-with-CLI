#!/bin/sh

# The build process is disgustingly heavy on the disk. This file replaces .tmp
# with a ramdisk.
# NOTE: this work in dev, but not with production build. Unmount the ramdisk
# and delete .tmp prior to doing a prod build.

# Create .tmp if it doesn't already exist. Note that we don't need to delete
# .tmp if it already exists because the contents will be shadowed.
mkdir -p .tmp

# Create the ramdisk.  At the time of writing, .tmp is 20M after a successful
# build, so let's give it 32M to be safe.
sudo mount -o size=32M -t tmpfs none .tmp

