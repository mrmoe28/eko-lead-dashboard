#!/bin/bash

# Screenshot Viewer
# Opens screenshots in default viewer

echo "📸 Available Screenshots:"
echo ""

# Find all PNG files in current directory
screenshots=($(find . -maxdepth 1 -name "*.png" -type f | sort))

if [ ${#screenshots[@]} -eq 0 ]; then
    echo "❌ No screenshots found in current directory"
    echo ""
    echo "💡 To take screenshots:"
    echo "   npx tsx screenshot-tool.ts <url> [filename]"
    exit 1
fi

for i in "${!screenshots[@]}"; do
    file="${screenshots[$i]##*/}"
    size=$(stat -f%z "${screenshots[$i]}" 2>/dev/null || stat -c%s "${screenshots[$i]}" 2>/dev/null)
    
    # Convert bytes to human readable
    if [ $size -gt 1048576 ]; then
        size_human=$(echo "scale=1; $size/1048576" | bc 2>/dev/null || echo $((size/1048576))"MB")
    elif [ $size -gt 1024 ]; then
        size_human=$(echo "scale=1; $size/1024" | bc 2>/dev/null || echo $((size/1024))"KB")
    else
        size_human="${size}B"
    fi
    
    printf "%2d. %-30s %10s\n" $((i+1)) "$file" "$size_human"
done

echo ""
read -p "Enter screenshot number to open (or 0 to exit): " -r choice

if [[ $choice =~ ^[0-9]+$ ]] && [ $choice -ge 1 ] && [ $choice -le ${#screenshots[@]} ]; then
    selected="${screenshots[$((choice-1))]}"
    echo "📸 Opening: ${selected##*/}"
    open "$selected"
elif [ $choice -eq 0 ]; then
    echo "👋 Goodbye!"
else
    echo "❌ Invalid selection"
fi