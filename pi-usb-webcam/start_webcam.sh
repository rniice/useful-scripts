#!/bin/bash
#source: http://mechanicalscribe.com/notes/raspberry-pi-time-lapse-images/

#argument 1: destination folder name               (required)
#argument 2: time interval between snapshots [sec] (required)
#argument 3: total duration to run timelapse [hrs] (optional)

#documentation for config is here: http://manpages.ubuntu.com/manpages/lucid/man1/fswebcam.1.html

mkdir -p motion/media

if [ -z $1 ] 
  then
        echo "Please supply a desination folder name"
        exit 0
fi
name=$1
echo $name
if [ -d /home/pi/motion/media/${name} ]
  then
    echo "Already have a project with that name."
    exit 0
fi

echo "Making project $name"
mkdir /home/pi/motion/media/${name}

if [ -z $2 ]
  then
        echo "Please supply an interval in seconds"
        exit 0
fi
interval=$2
echo $interval

if [ -z $3 ]
  then
        duration = 360       
        echo "Duration not set, defaulting to 1 hrs (360sec)"
  else
        duration=$3 
        echo "Duration set to: ${duration} seconds"
fi

#let duration = $(expr $duration\*60\*60)

i=0
elapsed=0

while true; do
    sleep ${interval}
    fswebcam -c webcam_config.conf \
        --save=/home/pi/motion/media/snapshot.jpg \
        --exec="cp /home/pi/motion/media/snapshot.jpg /home/pi/motion/media/${name}/snapshot-%Y-%m-%d-%H-%M-%S.jpg" \
        --log=/home/pi/motion/media/${name}/webcam.log

    #this example copies the current image to a location that is displayed by a web server    
    #scp /home/pi/motion/media/antcam.jpg [username]@mechanicalscribe.com:/path/to/antcam.jpg

    echo "Took image ${i}"
    let i=i+1

    echo "Elapsed time [sec]: ${elapsed}"
    let elapsed=elapsed+interval
done
exit 0

#while [elapsed -lt duration]
#while true; do
#    sleep interval
#    fswebcam -c webcam_config.conf \
#        --save=/home/pi/motion/media/snapshot.jpg \
#        --exec="cp /home/pi/motion/media/snapshot.jpg /home/pi/motion/media/${name}/snapshot-%Y-%m-%d-%H-%M-%S.jpg" \
#        --log=/home/pi/motion/media/${name}/webcam.log

    #this example copies the current image to a location that is displayed by a web server    
    #scp /home/pi/motion/media/antcam.jpg [username]@mechanicalscribe.com:/path/to/antcam.jpg

#    echo "Took image ${i}"
#    let i=i+1
#done
#exit 0