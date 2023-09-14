# Kenchi Demo Video

## Setting up the demo

1. Make sure your content exists: you need at least a collection named "Account Support" and a space named "Tier 2" containing at least that collection.
1. Visit https://app.kenchi.dev/demo
1. Open Kenchi (this will make it momentarily appear and then hide it, effectively pre-loading it)
1. Start recording and run through the actions

## Video conversion

* To convert to webm:
`ffmpeg -i input.mov -c:v libvpx -quality good -cpu-used 0 -b:v 7000k -qmin 10 -qmax 42 -maxrate 500k -bufsize 1500k -threads 8 -vf scale=-1:1080 -c:a libvorbis -b:a 192k -f webm demo.webm`

* Without rescaling:
`ffmpeg -i input.mov -c:v libvpx -quality good -cpu-used 0 -b:v 7000k -qmin 10 -qmax 42 -maxrate 500k -bufsize 1500k -threads 8 -c:a libvorbis -b:a 192k -f webm demo.webm`
