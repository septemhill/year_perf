import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# List of tickers to fetch
TICKERS = ["VOO", "QQQ", "IWM", "MAGS", "SCHG", "VGT", "SMH"]

def get_ticker_price_history(ticker_symbol: str, years: int = 10):
    """
    Fetches the closing price history for a given ticker for the specified number of years.
    """
    ticker = yf.Ticker(ticker_symbol)
    
    # Calculate start and end dates
    end_date = datetime.now()
    # If current year is 2026, we want to start from 2017/01/01
    start_year = end_date.year - 9
    start_date = datetime(start_year, 1, 1)
    
    # Fetch history
    history = ticker.history(start=start_date, end=end_date, auto_adjust=False)
    
    if history.empty:
        print(f"No data found for ticker: {ticker_symbol}")
        return None
    
    # Keep only the Close price
    close_prices = history[['Close']]
    
    return close_prices

def calculate_yearly_performance(data: pd.DataFrame):
    """
    Calculates the percentage change of each price relative to the first trading day of its year.
    Formula: ((Current Price / First Price of Year) - 1) * 100
    """
    if data is None or data.empty:
        return None
    
    # Ensure index is datetime to extract year
    data.index = pd.to_datetime(data.index)
    
    # Get the first price of each year
    first_prices = data.groupby(data.index.year)['Close'].transform('first')
    
    # Calculate percentage change
    data['YearlyPerf'] = ((data['Close'] / first_prices) - 1) * 100
    
    return data

def get_worst_months(data: pd.DataFrame):
    """
    Identifies the top 3 worst-performing months for each year based on geometric mean.
    Also calculates Monthly Total Return and Maximum Drawdown (MDD) for these months.
    """
    if data is None or data.empty:
        return {}
    
    # Ensure index is datetime
    df = data.copy()
    df.index = pd.to_datetime(df.index)
    df['Year'] = df.index.year
    df['Month'] = df.index.month
    
    # Get previous closing prices for Monthly Return calculation
    # We'll use the price before each group if available
    full_prices = df['Close']
    
    monthly_stats = []
    
    # Group by Year and Month
    for (year, month), group in df.groupby(['Year', 'Month']):
        prices = group['Close']
        if prices.empty:
            continue
            
        # 1. Geometric Mean (as previously defined for ranking)
        first_price = prices.iloc[0]
        ratios = prices / first_price
        geo_mean_ratio = np.exp(np.log(ratios).mean())
        geo_mean_perf = (geo_mean_ratio - 1) * 100
        
        # 2. Monthly Total Return: (P_end - P_start) / P_start
        # Using the actual first price of the month as P_start
        monthly_return = (prices.iloc[-1] / first_price - 1) * 100
        
        # 3. Maximum Drawdown (MDD) within the month
        peak = prices.cummax()
        drawdown = (prices / peak - 1) * 100
        mdd = drawdown.min()
        
        monthly_stats.append({
            'year': year,
            'month': month,
            'geo_mean': geo_mean_perf,
            'monthly_return': monthly_return,
            'mdd': mdd
        })
    
    monthly_df = pd.DataFrame(monthly_stats)
    
    worst_months_by_year = {}
    
    for year, group in monthly_df.groupby('year'):
        # Ranking still based on geometric mean performance
        bottom_3 = group.sort_values(by='geo_mean').head(3)
        
        worst_months_by_year[int(year)] = [
            {
                "month": int(row['month']), 
                "geo_mean": round(float(row['geo_mean']), 2),
                "monthly_return": round(float(row['monthly_return']), 2),
                "mdd": round(float(row['mdd']), 2)
            }
            for _, row in bottom_3.iterrows()
        ]
        
    return worst_months_by_year

def get_all_tickers_perf(tickers: list):
    """
    Fetches and aggregates YearlyPerf data and Worst Months for a list of tickers.
    Returns a dictionary with tickers as keys.
    """
    all_data = {}
    for symbol in tickers:
        print(f"Fetching and processing: {symbol}")
        data = get_ticker_price_history(symbol)
        if data is not None:
            worst_months = get_worst_months(data)
            data = calculate_yearly_performance(data)
            # Format the index to YYYY-MM-dd strings
            data.index = data.index.strftime('%Y-%m-%d')
            
            all_data[symbol] = {
                "history": data['YearlyPerf'].to_dict(),
                "worst_months": worst_months
            }
    
    return all_data

if __name__ == "__main__":
    import json
    import sys
    import os
    
    # Define output directory relative to this script (../public/data)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "public", "data")
    
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Check if a specific symbol was passed as an argument, else use the TICKERS list
    if len(sys.argv) > 1:
        symbols = [sys.argv[1]]
        filename = f"{sys.argv[1]}_10y.json"
    else:
        symbols = TICKERS
        filename = "all_tickers_10y.json"
    
    output_path = os.path.join(output_dir, filename)
    
    print(f"Fetching data for: {symbols}")
    
    combined_data = get_all_tickers_perf(symbols)
    
    if combined_data:
        with open(output_path, 'w') as f:
            json.dump(combined_data, f)
        print(f"Saved aggregated data to {output_path}")

