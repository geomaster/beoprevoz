#!/bin/sh
echo -ne "__miroslav_index = \"" > index.bin.js
./b64.php < index.bin >> index.bin.js
echo -ne \" >> index.bin.js

echo -ne "__miroslav_data = \"" > data.bin.js
./b64.php < data.bin >> data.bin.js
echo -ne \" >> data.bin.js

