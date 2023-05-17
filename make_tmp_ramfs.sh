#!/bin/sh

# The build process is disgustingly heavy on the disk. This file replaces .tmp
# with a ramdisk.

# Create .tmp if it doesn't already exist. Note that we don't need to delete
# .tmp if it already exists because the contents will be shadowed.
mkdir -p .tmp

# Create the ramdisk.  At the time of writing, .tmp is 20M after a successful
# build, so let's give it 32M to be safe.
mount -o size=32M -t tmpfs none .tmp
