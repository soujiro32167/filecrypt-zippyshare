set -x

curl -s -I -b cookiejar -c cookiejar "https://filecrypt.cc/Container/56261C0EF5.html" > /dev/null
ZIPPYSHARE_URL=$(curl -s -b cookiejar -c cookiejar \
    -H "Referrer: https://filecrypt.cc/Container/56261C0EF5.html" \
    "http://filecrypt.cc/Link/nGMRWNiiyZXSmQo02umHwz6ucjLBX6Jlzs8nQ9nzHTemgHI901xYHvxYwZ8YPWtFKcWp-hjY59uZLSxhkD6q4a0Eb3v6yZE8aj8ncGX-iktKnVQoNQIbop7BIo0UftaC.html" \
    | grep '<iframe' \
    | sed -E 's/.*src="(.*)".*/\1/' \
    | xargs -I {} curl -I -s -c cookiejar -b cookiejar {} \
    | grep 'Location: ' \
    | sed -E 's/Location: //' \
    | tr -d "\r" )
ZIPPYSHARE_DOMAIN=$( echo $ZIPPYSHARE_URL | sed 's/\.com.*$/.com/')
echo "Domain: $ZIPPYSHARE_DOMAIN"
echo "URL: ${ZIPPYSHARE_URL}"

curl -s -b cookiejar -c cookiejar "$ZIPPYSHARE_URL" \
    | grep "document.getElementById('dlbutton')"