import pandas as pd
import psycopg2
from datetime import datetime, timedelta

def fetch_sales_data():
    conn = psycopg2.connect("dbname='ecommerce' user='user' password='password'")
    query = "SELECT * FROM sales WHERE date >= %s"
    start_date = datetime.now() - timedelta(days=30)
    df = pd.read_sql_query(query, conn, params=(start_date,))
    conn.close()
    return df

def generate_insights(df):
    top_selling_products = df.groupby('product_id').sum()['quantity'].nlargest(10)
    return top_selling_products

if __name__ == "__main__":
    sales_data = fetch_sales_data()
    insights = generate_insights(sales_data)
    print(insights)