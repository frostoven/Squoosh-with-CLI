#!/bin/sh -e

# Not really meant as a serious test setup, really just here to make sure
# things actually run and automatically add defaults where needed without
# crashing or freezing.

if ! test -d /tmp/squoosh-test; then
  echo 'Please place some images in /tmp/squoosh-test to run this test script.'
  exit 1
fi

# =============================================================================
# Ensure the CLI tool doesn't freeze or crash when used correctly.
# =============================================================================

npx @frostoven/squoosh-cli --oxipng '{"level":2,"interlace":false}' /tmp/squoosh-test/
npx @frostoven/squoosh-cli --oxipng '{"level":2}' /tmp/squoosh-test/

npx @frostoven/squoosh-cli --quant '{"enabled":true,"zx":0,"maxNumColors":64,"dither":1}' --mozjpeg '{"quality":75,"baseline":false,"arithmetic":false,"progressive":true,"optimize_coding":true,"smoothing":0,"color_space":3,"quant_table":3,"trellis_multipass":false,"trellis_opt_zero":false,"trellis_opt_table":false,"trellis_loops":1,"auto_subsample":true,"chroma_subsample":2,"separate_chroma_quality":false,"chroma_quality":75}' /tmp/squoosh-test/
npx @frostoven/squoosh-cli --mozjpeg '{"quality":75,"baseline":false,"arithmetic":false,"progressive":true,"optimize_coding":true,"smoothing":0,"color_space":3,"quant_table":3,"trellis_multipass":false,"trellis_opt_zero":false,"trellis_opt_table":false,"trellis_loops":1,"auto_subsample":true,"chroma_subsample":2,"separate_chroma_quality":false,"chroma_quality":75}' /tmp/squoosh-test/
npx @frostoven/squoosh-cli --mozjpeg '{"progressive":true,"optimize_coding":true,"smoothing":0,"color_space":3,"quant_table":3,"trellis_multipass":false,"trellis_opt_zero":false,"trellis_opt_table":false,"trellis_loops":1,"auto_subsample":true,"chroma_subsample":2,"separate_chroma_quality":false,"chroma_quality":75}' /tmp/squoosh-test/

npx @frostoven/squoosh-cli --webp '{"quality":75,"target_size":0,"target_PSNR":0,"method":4,"sns_strength":50,"filter_strength":60,"filter_sharpness":0,"filter_type":1,"partitions":0,"segments":4,"pass":1,"show_compressed":0,"preprocessing":0,"autofilter":0,"partition_limit":0,"alpha_compression":1,"alpha_filtering":1,"alpha_quality":100,"lossless":0,"exact":0,"image_hint":0,"emulate_jpeg_size":0,"thread_level":0,"low_memory":0,"near_lossless":100,"use_delta_palette":0,"use_sharp_yuv":0}' /tmp/squoosh-test/
npx @frostoven/squoosh-cli --webp '{"target_size":0,"target_PSNR":0,"method":4,"sns_strength":50,"filter_strength":60,"filter_sharpness":0,"filter_type":1,"partitions":0,"segments":4,"pass":1,"show_compressed":0,"preprocessing":0,"autofilter":0,"partition_limit":0,"alpha_compression":1,"alpha_filtering":1,"alpha_quality":100,"lossless":0,"exact":0,"image_hint":0,"emulate_jpeg_size":0,"thread_level":0,"low_memory":0,"near_lossless":100,"use_delta_palette":0,"use_sharp_yuv":0}' /tmp/squoosh-test/

npx @frostoven/squoosh-cli --avif '{}' /tmp/squoosh-test/
npx @frostoven/squoosh-cli --avif '{"cqLevel":33,"cqAlphaLevel":-1,"denoiseLevel":0,"tileColsLog2":0,"tileRowsLog2":0,"speed":6,"subsample":1,"chromaDeltaQ":false,"sharpness":0,"tune":0}' /tmp/squoosh-test/

# =============================================================================
# Test preprocessor options
# =============================================================================

echo "Images in /tmp/squoosh-test will now be degraded."
echo "Press Enter when ready."
read answer

# Bugfix for issue #3 - ensure preprocessor options are used.
npx @frostoven/squoosh-cli --quant '{maxNumColors:2}' --oxipng '{"level":2}' /tmp/squoosh-test/

# =============================================================================

# JXL is still beta.
# npx @frostoven/squoosh-cli --jxl '{"quality":75,"progressive":false,"epf":-1,"lossyPalette":false,"decodingSpeedTier":0,"photonNoiseIso":0,"lossyModular":false}' /tmp/squoosh-test/
# npx @frostoven/squoosh-cli --jxl '{"effort":7,"quality":75,"progressive":false,"epf":-1,"lossyPalette":false,"decodingSpeedTier":0,"photonNoiseIso":0,"lossyModular":false}' /tmp/squoosh-test/
