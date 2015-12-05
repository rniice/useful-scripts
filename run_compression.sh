a=1
for input in *.MOD; do

	new_file=$(printf "%04d.MP4" "$a") #04 pad to length of 4

	ffmpeg -i $input -c:v libx264 -crf 28 -vf scale=-2:720,format=yuv420p $new_file
  
  	#mv -- "$i" "$new"
  	let a=a+1
done