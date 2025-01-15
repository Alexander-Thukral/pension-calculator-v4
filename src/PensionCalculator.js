import React, { useState } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

// ... (previous code remains the same until calculateHistoricalData function)

const calculateHistoricalData = (data) => {
  const calculations = {
    '8.33': { yearlyData: {}, total: 0 },
    '1.16': { yearlyData: {}, total: 0 }
  };

  // Process data by financial year (Feb-Jan)
  data.forEach(row => {
    const wageMonth = row['Wage Month (all the months from date of joining to date of leaving)'];
    if (!wageMonth) return;

    const [month, yearStr] = wageMonth.split('/');
    const monthNum = parseInt(month);
    const year = parseInt(yearStr);
    
    // New FY calculation: If month is January, it belongs to previous year's FY
    // For all other months, they belong to the current year's FY
    const fy = monthNum === 1 
      ? `${year-1}-${year.toString().slice(2)}`
      : `${year}-${(year+1).toString().slice(2)}`;
    
    if (!calculations['8.33'].yearlyData[fy]) {
      calculations['8.33'].yearlyData[fy] = { 
        wages: 0, 
        contribution: 0, 
        paid: 0, 
        difference: 0, 
        interest: 0, 
        total: 0 
      };
      calculations['1.16'].yearlyData[fy] = { 
        wages: 0, 
        contribution: 0, 
        paid: 0, 
        difference: 0, 
        interest: 0, 
        total: 0 
      };
    }

    const wages = parseInt(row['Wages on which PF contribution was paid']) || 0;
    const contribution833 = Math.round(wages * 0.0833);
    const paid = getFixedAmount(monthNum, year);

    calculations['8.33'].yearlyData[fy].wages += wages;
    calculations['8.33'].yearlyData[fy].contribution += contribution833;
    calculations['8.33'].yearlyData[fy].paid += paid;

    if (year > 2014 || (year === 2014 && monthNum >= 9)) {
      const contribution116 = Math.round(wages * 0.0116);
      calculations['1.16'].yearlyData[fy].wages += wages;
      calculations['1.16'].yearlyData[fy].contribution += contribution116;
    }
  });

  // Rest of the calculation remains the same
  ['8.33', '1.16'].forEach(rate => {
    let cumulativeBalance = 0;
    Object.entries(calculations[rate].yearlyData)
      .filter(([fy]) => fy <= '2023-24')
      .forEach(([fy, yearData]) => {
        yearData.difference = Math.max(yearData.contribution - yearData.paid, 0);
        const interestRate = getInterestRate(fy);
        yearData.interest = Math.round((cumulativeBalance + yearData.difference) * interestRate / 100);
        yearData.total = yearData.difference + yearData.interest;
        cumulativeBalance += yearData.total;
        if (fy === '2023-24') {
          calculations[rate].total = cumulativeBalance;
        }
      });
  });

  return calculations;
};

const PensionCalculator = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculatePaymentSchedule = (openingBalance) => {
    const schedule = [];
    const dates = [
      "31-03-2024",
      "30-04-2024",
      "31-05-2024",
      "30-06-2024",
      "31-07-2024",
      "31-08-2024",
      "30-09-2024",
      "31-10-2024",
      "30-11-2024",
      "31-12-2024",
      "31-01-2025",
      "28-02-2025",
      "31-03-2025",
      "30-04-2025",
      "31-05-2025",
      "30-06-2025",
      "31-07-2025",
      "31-08-2025",
    ];

    let baseAmount = openingBalance;

    // Initial entry with no interest
    schedule.push({
      date: dates[0],
      interest: 0,
      totalPayable: baseAmount,
    });

    // First year calculations (April 2024 - March 2025)
    for (let month = 1; month < 13; month++) {
      const interest = Math.round((baseAmount * 8.25 * month) / 1200);
      schedule.push({
        date: dates[month],
        interest,
        totalPayable: baseAmount + interest,
      });
    }

    // Update base amount for next year
    baseAmount = schedule[12].totalPayable;

    // Second year calculations (April 2025 onwards)
    for (let month = 13; month < dates.length; month++) {
      const monthsFromApril = month - 12;
      const interest = Math.round((baseAmount * 8.25 * monthsFromApril) / 1200);
      schedule.push({
        date: dates[month],
        interest,
        totalPayable: baseAmount + interest,
      });
    }

    return schedule;
  };

  const getInterestRate = (fy) => {
    const interestRates = {
      "1995-96": 12,
      "1996-97": 12,
      "1997-98": 12,
      "1998-99": 12,
      "1999-00": 12,
      "2000-01": 11,
      "2001-02": 9.5,
      "2002-03": 9.5,
      "2003-04": 9.5,
      "2004-05": 9.5,
      "2005-06": 8.5,
      "2006-07": 8.5,
      "2007-08": 8.5,
      "2008-09": 8.5,
      "2009-10": 8.5,
      "2010-11": 9.5,
      "2011-12": 8.25,
      "2012-13": 8.5,
      "2013-14": 8.75,
      "2014-15": 8.75,
      "2015-16": 8.8,
      "2016-17": 8.65,
      "2017-18": 8.55,
      "2018-19": 8.65,
      "2019-20": 8.5,
      "2020-21": 8.5,
      "2021-22": 8.1,
      "2022-23": 8.15,
      "2023-24": 8.25,
    };
    return interestRates[fy] || 8.25;
  };

  const getFixedAmount = (month, year) => {
    if (year === 1995 && month === 11) return 209;
    if (year < 2001 || (year === 2001 && month < 6)) return 417;
    if (year < 2014 || (year === 2014 && month < 9)) return 541;
    return 1250;
  };

  const calculateHistoricalData = (data) => {
    const calculations = {
      8.33: { yearlyData: {}, total: 0 },
      1.16: { yearlyData: {}, total: 0 },
    };

    // Process data by financial year
    data.forEach((row) => {
      const wageMonth =
        row[
          "Wage Month (all the months from date of joining to date of leaving)"
        ];
      if (!wageMonth) return;

      const [month, yearStr] = wageMonth.split("/");
      const monthNum = parseInt(month);
      const year = parseInt(yearStr);
      const fy =
        monthNum <= 3
          ? `${year - 1}-${year.toString().slice(2)}`
          : `${year}-${(year + 1).toString().slice(2)}`;

      if (!calculations["8.33"].yearlyData[fy]) {
        calculations["8.33"].yearlyData[fy] = {
          wages: 0,
          contribution: 0,
          paid: 0,
          difference: 0,
          interest: 0,
          total: 0,
        };
        calculations["1.16"].yearlyData[fy] = {
          wages: 0,
          contribution: 0,
          paid: 0,
          difference: 0,
          interest: 0,
          total: 0,
        };
      }

      const wages =
        parseInt(row["Wages on which PF contribution was paid"]) || 0;
      const contribution833 = Math.round(wages * 0.0833);
      const paid = getFixedAmount(monthNum, year);

      calculations["8.33"].yearlyData[fy].wages += wages;
      calculations["8.33"].yearlyData[fy].contribution += contribution833;
      calculations["8.33"].yearlyData[fy].paid += paid;

      if (year > 2014 || (year === 2014 && monthNum >= 9)) {
        const contribution116 = Math.round(wages * 0.0116);
        calculations["1.16"].yearlyData[fy].wages += wages;
        calculations["1.16"].yearlyData[fy].contribution += contribution116;
      }
    });

    // Calculate interest
    ["8.33", "1.16"].forEach((rate) => {
      let cumulativeBalance = 0;
      Object.entries(calculations[rate].yearlyData)
        .filter(([fy]) => fy <= "2023-24")
        .forEach(([fy, yearData]) => {
          yearData.difference = Math.max(
            yearData.contribution - yearData.paid,
            0
          );
          const interestRate = getInterestRate(fy);
          yearData.interest = Math.round(
            ((cumulativeBalance + yearData.difference) * interestRate) / 100
          );
          yearData.total = yearData.difference + yearData.interest;
          cumulativeBalance += yearData.total;
          if (fy === "2023-24") {
            calculations[rate].total = cumulativeBalance;
          }
        });
    });

    return calculations;
  };

  const processData = (data) => {
    try {
      const historicalData = calculateHistoricalData(data);
      const schedules = {
        8.33: calculatePaymentSchedule(historicalData["8.33"].total),
        1.16: calculatePaymentSchedule(historicalData["1.16"].total),
      };
      setResults({ historicalData, schedules });
    } catch (err) {
      setError("Error processing data: " + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
          setLoading(false);
        },
        error: (error) => {
          setError("Error parsing CSV: " + error.message);
          setLoading(false);
        },
      });
    } catch (err) {
      setError("Error reading file: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Pension Contribution Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Upload CSV file</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading && <div className="text-center">Processing...</div>}

          {results && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Historical Data</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Year</th>
                      <th className="px-4 py-2 text-right">Wages</th>
                      <th className="px-4 py-2 text-right">8.33%</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">1.16%</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.historicalData["8.33"].yearlyData)
                      .filter(([fy]) => fy <= "2023-24")
                      .map(([fy, data833]) => {
                        const data116 =
                          results.historicalData["1.16"].yearlyData[fy];
                        return data833.wages > 0 || data833.interest > 0 ? (
                          <tr key={fy} className="border-t">
                            <td className="px-4 py-2">{fy}</td>
                            <td className="px-4 py-2 text-right">
                              {data833.wages.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data833.difference.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data833.interest.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data116?.contribution.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data116?.interest.toLocaleString()}
                            </td>
                          </tr>
                        ) : null;
                      })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <ScheduleTable
                  schedule={results.schedules["8.33"]}
                  type="8.33%"
                />
                <ScheduleTable
                  schedule={results.schedules["1.16"]}
                  type="1.16%"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PensionCalculator;
