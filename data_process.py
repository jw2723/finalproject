import pandas as pd

# Load datasets
life_exp = pd.read_csv('/Users/jingqiwang/Desktop/In Progress/Cornell University/INFO 5311 visualization/final project/Life Expectancy Data.csv')
sugar = pd.read_csv('/Users/jingqiwang/Desktop/In Progress/Cornell University/INFO 5311 visualization/final project/sugar16-21.csv')
meat = pd.read_csv('/Users/jingqiwang/Desktop/In Progress/Cornell University/INFO 5311 visualization/final project/meat_consumption_worldwide.csv')

# Dictionary to map country names from life expectancy data to sugar data
country_name_mapping = {
    "United States of America": "United States",
    "Russian Federation": "Russia",
    "Republic of Korea": "South Korea",
    "Iran (Islamic Republic of)": "Iran",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "Czech Republic": "Czechia",
    "Viet Nam": "Vietnam"
}

# Filter for EU countries
eu_member_countries = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia",
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
    "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
    "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia",
    "Spain", "Sweden"
]

# Apply the country name mapping to both datasets
life_exp['Country'] = life_exp['Country'].replace(country_name_mapping)
sugar['Country'] = sugar['Country'].replace(country_name_mapping)

# Strip spaces from column names in life expectancy data
life_exp.columns = life_exp.columns.str.strip()

# Convert life expectancy to numeric, handling non-numeric values too
life_exp['Life expectancy'] = pd.to_numeric(life_exp['Life expectancy'], errors='coerce')

# Filter life expectancy data for EU countries
eu_life_exp = life_exp[life_exp['Country'].isin(eu_member_countries)]

# Calculate avg life expectancy for EU
eu_average_life_exp = eu_life_exp['Life expectancy'].mean()

# Calculate average life expectancy per country
avg_life_exp = life_exp.groupby('Country')['Life expectancy'].mean().reset_index()
avg_life_exp.rename(columns={'Life expectancy': 'Avg Life Expectancy'}, inplace=True)

# Add EU avg life expectancy
eu_avg_entry = pd.DataFrame({"Country": ["European Union"], "Avg Life Expectancy": [eu_average_life_exp]})
avg_life_exp = pd.concat([avg_life_exp, eu_avg_entry], ignore_index=True)

# Round life expectancy to one decimal place
avg_life_exp['Avg Life Expectancy'] = avg_life_exp['Avg Life Expectancy'].round(1)

# Calculate avg sugar consumption
sugar_columns = [col for col in sugar.columns if col.isdigit()]
sugar['Average Consumption'] = sugar[sugar_columns].replace(',', '', regex=True).astype(float).mean(axis=1)

# Round consumption to one decimal place
sugar['Average Consumption'] = sugar['Average Consumption'].round(1)

sugar = sugar[['Country', 'Average Consumption']]

# Merge datasets on country column
merged_data = pd.merge(sugar, avg_life_exp, on='Country', how='inner')

print("Merged Data:")
print(merged_data)

merged_data.to_csv('/Users/jingqiwang/Desktop/In Progress/Cornell University/INFO 5311 visualization/final project/merged_sugar_life_expectancy.csv', index=False)

# Calculate the top 10 countries with the highest average life expectancy
top_10_countries = avg_life_exp.nlargest(10, 'Avg Life Expectancy')
print("Top 10 countries by life expectancy:")
print(top_10_countries)

# Top 10 countries by life expectancy:
#          Country  Avg Life Expectancy
# 84         Japan             82.53750
# 165       Sweden             82.51875
# 75       Iceland             82.44375
# 166  Switzerland             82.33125
# 60        France             82.21875
# 82         Italy             82.18750
# 160        Spain             82.06875
# 7      Australia             81.81250
# 125       Norway             81.79375
# 30        Canada             81.68750


# Country codes for selected top countries with highest life expectancy (exist in meat data)
country_codes = ['JPN', 'AUS', 'NOR', 'CAN']  # Japan, Australia, Norway, Canada
filtered_meat_data = meat[meat['LOCATION'].isin(country_codes)]

# Group by country and meat type
# Calculate avg consumption per capita
average_consumption = filtered_meat_data.groupby(['LOCATION', 'SUBJECT']).agg({'Value': 'mean'}).reset_index()

# Columns
average_consumption.columns = ['Country', 'Type of Meat', 'Average Consumption (kg per capita)']

# Round avg consumption to one decimal place
average_consumption['Average Consumption (kg per capita)'] = average_consumption['Average Consumption (kg per capita)'].round(1)

print("Average meat consumption per type in selected countries:")
print(average_consumption)

average_consumption.to_csv('/Users/jingqiwang/Desktop/In Progress/Cornell University/INFO 5311 visualization/final project/average_meat_consumption.csv', index=False)
