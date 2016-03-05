# pi-usb-webcam
code to run time lapse on raspberry pi

Dependencies:
1. python installed
2. install fswebcam: sudo apt-get install fswebcam

Usage:
1. configure webcam_config.conf
2. run start_webcam.sh

Example:
bash start_webcam.sh {project name} {time interval in sec} {total duration lapse (optional)}

bash start_webcam.sh demo2 10 20


desination folder is: ~/pi-usb-webcam/motion/media/{project name}

