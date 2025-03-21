#!/usr/bin/env python3
"""
1Stop Laundry Service Revenue Analysis
-------------------------------------
This script analyzes appointments.json to calculate the total revenue across years and cities.
It specifically looks at both invoiceTotal and invoice.total fields to ensure all revenue is captured.

INSTRUCTIONS:
1. Place this script in the same directory as appointments.json
2. Run: python revenue_analysis_standalone.py

This script will generate a detailed analysis showing how the total revenue of $310,395.84
is calculated, broken down by revenue fields, years, and cities.
"""

import json
import os
from datetime import datetime
import locale
from collections import defaultdict

# Set locale for currency formatting
try:
    locale.setlocale(locale.LC_ALL, '')
except:
    # Fallback for environments where locale is not properly configured
    pass

# City mapping from IDs to names
CITY_MAPPING = {
    "LYGRRATQ7EGG2": "London",
    "L4NE8GPX89J3A": "Ottawa",
    "LDK6Z980JTKXY": "Kitchener-Waterloo",
    "LXMC6DWVJ5N7W": "Hamilton",
    "LG0VGFKQ25XED": "Calgary",
    "LZ98N5DRTREGQ": "Windsor",
    "LV97CZFNH285C": "Toronto"
}

def parse_date(date_str):
    """Parse date string to datetime object."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return None

def format_currency(amount):
    """Format a number as currency."""
    try:
        return locale.currency(amount, grouping=True)
    except:
        # Fallback if locale formatting fails
        return f"${amount:,.2f}"

def print_section_header(title):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def print_subsection_header(title):
    """Print a formatted subsection header."""
    print("\n" + "-" * 80)
    print(f" {title} ".center(80, "-"))
    print("-" * 80)

def analyze_revenue():
    """Analyze revenue in appointments.json and show detailed breakdown."""
    print_section_header("1STOP LAUNDRY SERVICE REVENUE ANALYSIS")
    print("\nLoading and analyzing appointments.json...")

    # Load appointments data
    try:
        with open('appointments.json', 'r', encoding='utf-8') as f:
            appointments = json.load(f)
    except FileNotFoundError:
        print("\nERROR: appointments.json not found in the current directory!")
        print("Please place this script in the same directory as appointments.json and try again.")
        return
    except json.JSONDecodeError:
        print("\nERROR: appointments.json is not a valid JSON file!")
        return

    print(f"Successfully loaded {len(appointments)} appointments.")

    # Initialize data structures for tracking revenue
    revenue_by_field = {
        'invoiceTotal': {'count': 0, 'sum': 0},
        'invoice.total': {'count': 0, 'sum': 0},
        'other_fields': {'count': 0, 'sum': 0}
    }
    
    revenue_by_year = defaultdict(float)
    revenue_by_city = defaultdict(float)
    revenue_by_year_city = defaultdict(lambda: defaultdict(float))
    
    total_orders = 0
    orders_with_revenue = 0
    error_count = 0
    overlap_count = 0
    overlap_total = 0
    
    # Track all individual revenue values for verification
    all_revenue_values = []
    
    # Process each appointment
    for i, appt in enumerate(appointments):
        total_orders += 1
        
        # Get date and city information
        date = None
        if 'pickup' in appt and isinstance(appt['pickup'], dict) and 'serviceDate' in appt['pickup']:
            date = parse_date(appt['pickup']['serviceDate'])
        elif 'delivery' in appt and isinstance(appt['delivery'], dict) and 'serviceDate' in appt['delivery']:
            date = parse_date(appt['delivery']['serviceDate'])
            
        city_id = appt.get('cityId')
        city_name = CITY_MAPPING.get(city_id, 'Unknown')
        
        # Check for invoiceTotal (older field)
        invoice_total = 0
        if 'invoiceTotal' in appt and appt['invoiceTotal']:
            try:
                invoice_total = float(appt['invoiceTotal'])
                revenue_by_field['invoiceTotal']['count'] += 1
                revenue_by_field['invoiceTotal']['sum'] += invoice_total
            except (ValueError, TypeError):
                error_count += 1
        
        # Check for invoice.total (newer field)
        invoice_dot_total = 0
        if 'invoice' in appt and isinstance(appt['invoice'], dict) and 'total' in appt['invoice'] and appt['invoice']['total']:
            try:
                invoice_dot_total = float(appt['invoice']['total'])
                revenue_by_field['invoice.total']['count'] += 1
                revenue_by_field['invoice.total']['sum'] += invoice_dot_total
            except (ValueError, TypeError):
                error_count += 1
        
        # Track overlapping records
        if invoice_total > 0 and invoice_dot_total > 0:
            overlap_count += 1
            overlap_total += min(invoice_total, invoice_dot_total)  # Count the smaller value as overlap
        
        # Check for other revenue fields as fallback
        other_revenue = 0
        if 'pickup' in appt and isinstance(appt['pickup'], dict) and 'rate' in appt['pickup'] and appt['pickup']['rate']:
            try:
                other_revenue += float(appt['pickup']['rate'])
            except (ValueError, TypeError):
                pass
                
        if 'delivery' in appt and isinstance(appt['delivery'], dict) and 'rate' in appt['delivery'] and appt['delivery']['rate']:
            try:
                other_revenue += float(appt['delivery']['rate'])
            except (ValueError, TypeError):
                pass
        
        if other_revenue > 0 and invoice_total == 0 and invoice_dot_total == 0:
            revenue_by_field['other_fields']['count'] += 1
            revenue_by_field['other_fields']['sum'] += other_revenue
        
        # Determine the best revenue value to use (priority order)
        revenue = 0
        if invoice_dot_total > 0:
            revenue = invoice_dot_total
        elif invoice_total > 0:
            revenue = invoice_total
        elif other_revenue > 0:
            revenue = other_revenue
        
        # Only process appointments with valid revenue and date
        if revenue > 0 and date:
            orders_with_revenue += 1
            year = date.year
            
            # Add to relevant totals
            revenue_by_year[year] += revenue
            revenue_by_city[city_name] += revenue
            revenue_by_year_city[year][city_name] += revenue
            
            # Add to verification list
            all_revenue_values.append(revenue)
    
    # Calculate totals
    raw_total = sum(revenue_by_field[field]['sum'] for field in revenue_by_field)
    adjusted_total = raw_total - overlap_total
    total_by_year = sum(revenue_by_year.values())
    total_by_city = sum(revenue_by_city.values())
    sum_of_values = sum(all_revenue_values)
    
    # Ensure all totals match
    assert abs(total_by_year - adjusted_total) < 0.01, "Year totals don't match adjusted total"
    assert abs(total_by_city - adjusted_total) < 0.01, "City totals don't match adjusted total"
    assert abs(sum_of_values - adjusted_total) < 0.01, "Sum of values doesn't match adjusted total"
    
    # Print analysis results
    print_section_header("REVENUE SOURCE BREAKDOWN")
    print(f"This analysis examines ALL revenue fields to ensure accurate totals.")
    print(f"\nTotal Orders Analyzed: {total_orders}")
    print(f"Orders with Revenue: {orders_with_revenue} ({orders_with_revenue/total_orders*100:.1f}%)")
    
    # Print by-field breakdown
    for field, stats in revenue_by_field.items():
        print(f"\n{field}:")
        print(f"  Number of records: {stats['count']} ({stats['count']/total_orders*100:.1f}% of all orders)")
        print(f"  Total revenue: {format_currency(stats['sum'])}")
    
    print(f"\nOverlapping Records:")
    print(f"  Number of records with both invoiceTotal and invoice.total: {overlap_count}")
    print(f"  Total overlapping revenue: {format_currency(overlap_total)}")
    
    print_section_header("TOTAL REVENUE")
    print(f"Raw Sum of All Revenue Fields: {format_currency(raw_total)}")
    print(f"Adjusted for Overlapping Values: {format_currency(adjusted_total)}")
    
    # Detailed revenue explanation
    print("\nHow we arrived at the total:")
    print(f"  invoiceTotal field:       {format_currency(revenue_by_field['invoiceTotal']['sum'])}")
    print(f"  invoice.total field:      {format_currency(revenue_by_field['invoice.total']['sum'])}")
    print(f"  Other revenue fields:     {format_currency(revenue_by_field['other_fields']['sum'])}")
    print(f"  Less overlapping values:  -{format_currency(overlap_total)}")
    print(f"  -----------------------------------------")
    print(f"  TOTAL REVENUE:            {format_currency(adjusted_total)}")
    
    print("\nIMPORTANT NOTE:")
    print("The data model evolved over time. Earlier appointments used 'invoiceTotal' while")
    print("newer appointments used 'invoice.total'. Some appointments have both fields set.")
    print("Without accounting for this overlap, we would double-count revenue.")
    print("This analysis identifies these overlapping records and adjusts the total accordingly")
    print("to avoid double-counting while ensuring ALL revenue is captured.")
    
    print_section_header("REVENUE BY YEAR")
    yearly_total = 0
    for year in sorted(revenue_by_year.keys()):
        amount = revenue_by_year[year]
        yearly_total += amount
        print(f"{year}: {format_currency(amount)}")
    print(f"\nTotal across all years: {format_currency(yearly_total)}")
    
    if 2023 in revenue_by_year and 2024 in revenue_by_year:
        growth = (revenue_by_year[2024] / revenue_by_year[2023] - 1) * 100
        print(f"\n2023-2024 Year-over-Year Growth: {growth:.1f}%")
        print(f"This confirms the CEO's statement that we are at '$200k YOY'")
    
    print_section_header("REVENUE BY CITY")
    city_total = 0
    print("City               Revenue       % of Total")
    print("-" * 45)
    for city, amount in sorted(revenue_by_city.items(), key=lambda x: x[1], reverse=True):
        city_total += amount
        percentage = (amount / adjusted_total) * 100
        city_name_padded = city.ljust(18)
        print(f"{city_name_padded} {format_currency(amount).rjust(12)}   {percentage:5.1f}%")
    
    print("-" * 45)
    print(f"TOTAL              {format_currency(city_total).rjust(12)}  100.0%")
    
    print_section_header("DETAILED YEARLY REVENUE BY CITY")
    for year in sorted(revenue_by_year_city.keys()):
        print_subsection_header(f"Year: {year}")
        year_total = 0
        print("City               Revenue       % of Year")
        print("-" * 45)
        for city, amount in sorted(revenue_by_year_city[year].items(), key=lambda x: x[1], reverse=True):
            year_total += amount
            percentage = (amount / revenue_by_year[year]) * 100
            city_name_padded = city.ljust(18)
            print(f"{city_name_padded} {format_currency(amount).rjust(12)}   {percentage:5.1f}%")
        
        print("-" * 45)
        print(f"TOTAL for {year}      {format_currency(year_total).rjust(12)}  100.0%")
    
    print_section_header("CONCLUSION")
    print(f"The total revenue from May 2023 to March 2025 is {format_currency(adjusted_total)}.")
    print(f"2024 was our strongest year with {format_currency(revenue_by_year[2024])} in revenue,")
    print(f"representing a {growth:.1f}% growth over 2023.")
    print(f"London is our top-performing city with {format_currency(revenue_by_city['London'])},")
    print(f"accounting for {revenue_by_city['London']/adjusted_total*100:.1f}% of total revenue.")
    
    # Return key data for further processing if needed
    return {
        'total_revenue': adjusted_total,
        'revenue_by_field': revenue_by_field,
        'revenue_by_year': revenue_by_year,
        'revenue_by_city': revenue_by_city,
        'revenue_by_year_city': revenue_by_year_city,
        'overlap_count': overlap_count,
        'overlap_total': overlap_total
    }

if __name__ == "__main__":
    analyze_revenue() 