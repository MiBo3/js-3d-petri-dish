"""
The preprocessing script for the visualization of network traffic.

Usage:
1.      python process_data.py (the script will use the file ../data/iptvlog.json as input data and output the processed data into ../data/iptv_ready.json)
2.      python process_data.py <output_json_path> (the script will use the file ./iptvlog.json as input data)
3.      python process_data.py <raw_json_path> <output_json_path>

Before launching the script, make sure you have pandas and numpy installed. If not, use pip install.
"""
import pandas as pd
import numpy as np
import sys


# extracts the location of a host by aggregating the ip address with a 24-bit mask
def extract_location_from_ip(ip):
    sliced = ip.split('.')
    sliced[3] = '0'
    return '.'.join(sliced)

# repairs timestamps which corresponded to unrealistic dates in our data
def repair_date(timestamp):
    if (str(timestamp) < '2020-03-01'):
        return timestamp
    return timestamp.replace(month=2, day=20)

# adds entries about switching the set-top-box off if host is inactive for more than 5 hours
def add_switchoffs(df):
    last_stamp = ''
    last_host = ''
    added_df = pd.DataFrame(columns=['timestamp', 'host', 'igmp_ip', 'igmp_port'])
    df = df.sort_values(by=['host', 'timestamp'])
    i = 0
    for index, row in df.iterrows():
        i += 1
        if i % 10000 == 0:
            print(i)
        if last_stamp != '' and row['host'] == last_host and pd.Timedelta(row['timestamp']-last_stamp).seconds > 5*3600:
            added_df = added_df.append({'timestamp': last_stamp + pd.Timedelta(hours=5), 'host': row['host'], 'igmp_ip': '0.0.0.0', 'igmp_port': '0'}, ignore_index=True)
        last_stamp = row['timestamp']
        if last_host != row['host']:
            last_host = row['host']
    return pd.concat([df, added_df], ignore_index=True, sort=False)

# encapsulates the preprocessing of the input data and saves it to a user-defined path as a json file
def preprocess(df):
    print("Data successfully loaded! Preprocessing...")

    print("Repairing faulty timestamps...")
    df['timestamp'] = df.timestamp.apply(repair_date)

    print("Adding switch-off entries...")
    df = add_switchoffs(df)

    print("Extracting location information...")
    df['location'] = df.host.apply(extract_location_from_ip)

    return df.sort_values(by=['timestamp'])

def main():
    try:
        filepath = '../data/iptvlog.json'
        outputpath = '../data/iptv_ready.json'
        if len(sys.argv) == 3:
            outputpath = sys.argv[2]
        elif len(sys.argv) == 4:
            filepath = sys.argv[2]
            outputpath = sys.argv[3]
        elif len(sys.argv) > 4:
            print("Error: Too many arguments!")
            exit()
    
        data = pd.read_json(filepath)
        data = preprocess(data)
        print("Data processed! Writing to file: " + outputpath)
        data.to_json(outputpath, orient='records')
    except Exception as e:
        print("Error: ", e)

if __name__ == "__main__":
    main()
