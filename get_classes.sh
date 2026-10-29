grep -ro 'class="[^"]*"' src/ | sed 's/class="//; s/"//g' | tr ' ' '\n' | sort | uniq -c | sort -nr
