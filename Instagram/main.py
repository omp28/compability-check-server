from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import csv
import os
import requests
from collections import defaultdict


graph = defaultdict(list)
def create_graph(searcher_id, elements, n):
    """Create an adjacency list graph where all elements connect to searcher_id"""
    for i in range(min(n, len(elements))):
        graph[searcher_id].append(elements[i])
    return graph

# Setup Chrome driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# Open Coursea
driver.get("https://www.instagram.com/")

# Sleep for 5 seconds
time.sleep(30)

user_to_search = ['instatestingbot7']
try:
    for depth in range(2):
        span_texts = []
        for seed_username in user_to_search:
            driver.get("https://www.instagram.com/"+seed_username+"/")
            followers_link = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH,f"//a[@href='/{seed_username}/followers/']")))
            followers_link.click()
            scrollable_div = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((
                By.CSS_SELECTOR, 
                'div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6'
            ))
        )

            # Scroll multiple times (adjust iterations as needed)
            for _ in range(10):  # Scroll 5 times
                # Scroll down using JavaScript
                driver.execute_script(
                    "arguments[0].scrollTop += arguments[0].offsetHeight * 0.8;",
                    scrollable_div
                )
                time.sleep(2)  # Allow content to load
            child_div = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR, 
                    'div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6 > div:first-child'
                ))
            )
            # Step 3: Get all span elements with the specified class and extract inner HTML
            span_elements = child_div.find_elements(
                By.CSS_SELECTOR, 
                'span._ap3a._aaco._aacw._aacx._aad7._aade'
            )
            time.sleep(10)
            span_texts = [span.get_attribute("innerHTML") for span in span_elements]
            n = len(span_texts)
            # Step 4: Store top n elements in an adjacency list graph with searcher_id as root
            searcher_id = seed_username
            graph = create_graph(searcher_id, span_texts, n)
        user_to_search = span_texts

except Exception as e:
    print(f"An error occurred: {e}")

finally:
    driver.quit()

print("Graph Structure:")
for key, value in graph.items():
    print(f"{key}: {value}")