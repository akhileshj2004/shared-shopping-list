for file in *.js *.css; do
  echo "==================== $file ===================="
  cat "$file"
  echo -e "\n"
done
