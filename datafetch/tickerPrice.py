import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# List of tickers to fetch
TICKERS = ["VOO", "QQQ", "IWM", "SCHG", "VGT", "SMH"]

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
    Identifies the top 3 worst-performing months for each year.
    """
    if data is None or data.empty:
        return {}
    
    # Resample to monthly and get the last price of each month
    # We use 'ME' for Month End (pandas >= 2.2.0) or 'M'
    try:
        monthly_prices = data['Close'].resample('ME').last()
    except ValueError:
        monthly_prices = data['Close'].resample('M').last()
        
    # Calculate monthly percentage change
    # Note: The first month will have NaN return as there's no previous month
    monthly_returns = monthly_prices.pct_change() * 100
    
    worst_months_by_year = {}
    
    for year, group in monthly_returns.groupby(monthly_returns.index.year):
        # Drop NaN values (like the first month of the whole dataset)
        group = group.dropna()
        if group.empty:
            continue
            
        # Get the bottom 3 months
        bottom_3 = group.sort_values().head(3)
        
        worst_months_by_year[int(year)] = [
            {"month": int(date.month), "return": round(float(ret), 2)}
            for date, ret in bottom_3.items()
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

