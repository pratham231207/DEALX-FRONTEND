import time
import random
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from supabase import create_client

# --- 1. Your Credentials ---
# Get these from your Supabase Project Settings > API
URL = "YOUR_SUPABASE_URL"
KEY = "YOUR_SUPABASE_ANON_KEY"
supabase = create_client(URL, KEY)

def get_amazon_price(page, url):
    try:
        page.goto(url, wait_until="domcontentloaded")
        time.sleep(random.uniform(3, 6)) # Mimic a human reading
        
        # Amazon India price selector
        price_element = page.wait_for_selector(".a-price-whole", timeout=10000)
        price_text = price_element.inner_text()
        
        # Convert "69,900" to 69900
        return int(price_text.replace(",", "").replace(".", ""))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    # 2. Fetch your 20 products from Supabase
    products = supabase.table("products").select("*").limit(20).execute().data
    
    with sync_playwright() as p:
        # 3. Start Stealth Browser
        browser = p.chromium.launch(headless=False) # Headless=False so you can WATCH it work!
        page = browser.new_page()
        stealth_sync(page)

        for item in products:
            print(f"Checking: {item['name']}")
            
            # Update Amazon Price
            new_price = get_amazon_price(page, item['amazonLink'])
            
            if new_price:
                # 4. Push back to Supabase
                supabase.table("products").update({"amazonPrice": new_price}).eq("id", item['id']).execute()
                print(f"✅ Success: ₹{new_price}")
            
            time.sleep(random.uniform(2, 4))

        browser.close()

if __name__ == "__main__":
    main()