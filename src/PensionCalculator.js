import React, { useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { UploadCloud } from "lucide-react";

// Historical interest rates by financial year
const HISTORICAL_INTEREST_RATES = {
  "1995-96": 12,
  "1996-97": 12,
  "1997-98": 12,
  "1998-99": 12,
  "1999-00": 11.25,
  "2000-01": 11.25,
  "2001-02": 9.5,
  "2002-03": 9.5,
  "2003-04": 9.5,
  "2004-05": 9.5,
  "2005-06": 9.5,
  "2006-07": 9.5,
  "2007-08": 9.5,
  "2008-09": 9.5,
  "2009-10": 9.5,
  "2010-11": 9.5,
  "2011-12": 9.5,
  "2012-13": 9.5,
  "2013-14": 8.75,
  "2014-15": 8.75,
  "2015-16": 8.75,
  "2016-17": 8.65,
  "2017-18": 8.55,
  "2018-19": 8.65,
  "2019-20": 8.5,
  "2020-21": 8.5,
  "2021-22": 8.1,
  "2022-23": 8.15,
  "2023-24": 8.25,
};

// Helper function to get interest rate for a specific financial year
const getInterestRateForYear = (fy) => {
  return HISTORICAL_INTEREST_RATES[fy] || 8.25; // default to current rate if not found
};

const calculateInterestBearingBalance = (monthlyDifferences) => {
  return Object.entries(monthlyDifferences).reduce(
    (total, [monthKey, diff]) => {
      const [year, month] = monthKey.split("-").map(Number);
      // Calculate months remaining until end of FY (February)
      const monthsRemaining =
        month <= 2
          ? 2 - month // For Jan (1) and Feb (2)
          : 14 - month; // For Mar (3) through Dec (12)
      return total + diff * monthsRemaining;
    },
    0
  );
};

const calculatePaidAmount = (month, year) => {
  if (year < 1995 || (year === 1995 && month < 11)) return 0;
  if (year < 2001 || (year === 2001 && month < 6)) return 417;
  if (year < 2014 || (year === 2014 && month < 9)) return 541;
  return 1250;
};

const ScheduleTable = ({ schedule, type }) => {
  const isFinancialYearEnd = (date) => {
    return date.endsWith("-03-2024") || date.endsWith("-03-2025");
  };

  return (
    <div>
      <h4 className="text-md font-medium mb-2">{type} Payment Schedule</h4>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-right">Opening Balance</th>
            <th className="px-4 py-2 text-right">Interest</th>
            <th className="px-4 py-2 text-right">Closing Balance</th>
          </tr>
        </thead>
        <tbody>
          {schedule?.map((payment, index) => {
            const prevPayment = index > 0 ? schedule[index - 1] : null;
            return (
              <tr
                key={index}
                className={`border-t ${
                  isFinancialYearEnd(payment.date)
                    ? "bg-gray-50 font-medium"
                    : ""
                }`}
              >
                <td className="px-4 py-2">{payment.date}</td>
                <td className="px-4 py-2 text-right">
                  {(index === 0
                    ? payment.totalPayable
                    : prevPayment?.totalPayable
                  ).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {payment.interest.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {payment.totalPayable.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PreviewPensionCalculator = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateInterestBearingBalance = (monthlyDifferences) => {
    return Object.entries(monthlyDifferences).reduce(
      (total, [monthKey, diff]) => {
        const [year, month] = monthKey.split("-").map(Number);
        // Calculate months remaining until end of FY (February)
        const monthsRemaining =
          month <= 2
            ? 2 - month // For Jan (1) and Feb (2)
            : 14 - month; // For Mar (3) through Dec (12)

        const contribution = diff * monthsRemaining;
        console.log("IBB Month Calculation:", {
          monthKey,
          diff,
          monthsRemaining,
          contribution,
        });
        return total + contribution;
      },
      0
    );
  };

  const calculateHistoricalData = (data) => {
    const calculations = {
      8.33: { yearlyData: {}, total: 0 },
      1.16: { yearlyData: {}, total: 0 },
    };

    // Process data by month
    const monthlyData = {};
    data.forEach((row) => {
      const wageMonth =
        row[
          "Wage Month (all the months from date of joining to date of leaving)"
        ];
      if (!wageMonth) return;

      const [month, yearStr] = wageMonth.split("/");
      const monthNum = parseInt(month);
      const year = parseInt(yearStr);
      const monthKey = `${year}-${month.padStart(2, "0")}`; // YYYY-MM format

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          8.33: {
            contribution: 0,
            paid: 0,
            difference: 0,
            monthlyDifferences: {},
          },
          1.16: { contribution: 0, monthlyDifferences: {} },
        };
      }

      const wages =
        parseInt(row["Wages on which PF contribution was paid"]) || 0;
      const contribution833 = Math.round(wages * 0.0833);
      const paid = calculatePaidAmount(monthNum, year);

      monthlyData[monthKey]["8.33"].contribution = contribution833;
      monthlyData[monthKey]["8.33"].paid = paid;
      monthlyData[monthKey]["8.33"].difference = contribution833 - paid;

      if (year > 2014 || (year === 2014 && monthNum >= 9)) {
        const wagesAbove15000 = Math.max(0, wages - 15000);
        const contribution116 = Math.round(wagesAbove15000 * 0.0116);
        monthlyData[monthKey]["1.16"].contribution = contribution116;
      }
    });

    // Calculate monthly difference and accumulate year-wise
    Object.entries(monthlyData).forEach(([monthKey, data]) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const monthNum = parseInt(monthStr);

      const fy =
        monthNum <= 2
          ? `${year - 1}-${year.toString().slice(2)}`
          : `${year}-${(year + 1).toString().slice(2)}`;

      // Initialize yearly data if not exists
      ["8.33", "1.16"].forEach((rate) => {
        if (!calculations[rate].yearlyData[fy]) {
          calculations[rate].yearlyData[fy] = {
            wages: 0,
            contribution: 0,
            paid: 0,
            difference: 0,
            interest: 0,
            total: 0,
            monthlyDifferences: {},
          };
        }

        // Store monthly differences for IBB calculation
        if (rate === "8.33" && data[rate].difference > 0) {
          calculations[rate].yearlyData[fy].monthlyDifferences[monthKey] =
            data[rate].difference;
          calculations[rate].yearlyData[fy].difference += data[rate].difference;
        } else if (rate === "1.16" && data[rate].contribution > 0) {
          calculations[rate].yearlyData[fy].monthlyDifferences[monthKey] =
            data[rate].contribution;
          calculations[rate].yearlyData[fy].difference +=
            data[rate].contribution;
        }
      });
    });

    // Calculate interest and running totals
    // Calculate interest and running totals with compounding
    ["8.33", "1.16"].forEach((rate) => {
      let cumulativeBalance = 0;
      const startYear = 1995;

      for (let year = startYear; year <= 2023; year++) {
        const fy = `${year}-${(year + 1).toString().slice(2)}`;
        const yearData = calculations[rate].yearlyData[fy] || {
          wages: 0,
          contribution: 0,
          paid: 0,
          difference: 0,
          interest: 0,
          total: 0,
          monthlyDifferences: {},
        };

        // Calculate IBB for current year's contributions
        const currentYearIBB = calculateInterestBearingBalance(
          yearData.monthlyDifferences
        );
        console.log(
          `FY: ${fy}, Rate: ${rate}, Current Year IBB:`,
          currentYearIBB
        );

        // Get interest rate for the year
        const yearlyInterestRate = getInterestRateForYear(fy);

        // Calculate interest on accumulated balance from previous years
        const interestOnCumulativeBalance = Math.round(
          (cumulativeBalance * yearlyInterestRate) / 100
        );

        // Calculate interest on current year's IBB
        const interestOnCurrentYear = Math.round(
          (currentYearIBB * yearlyInterestRate) / 1200
        );

        // Total interest for the year is sum of both
        yearData.interest = interestOnCumulativeBalance + interestOnCurrentYear;

        // Update total including compounded interest
        yearData.total =
          cumulativeBalance + yearData.difference + yearData.interest;
        cumulativeBalance = yearData.total;

        calculations[rate].yearlyData[fy] = yearData;
        calculations[rate].total = cumulativeBalance;
      }
    });

    console.log("Final calculations:", calculations);
    return calculations;
  };

  const calculatePaymentSchedule = (openingBalance) => {
    const currentInterestRate = 8.25; // Current rate for future calculations
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
      "30-09-2025",
      "31-10-2025",
      "30-11-2025",
      "31-12-2025",
    ];

    let baseAmount = openingBalance;

    // Initial entry
    schedule.push({
      date: dates[0],
      interest: 0,
      totalPayable: baseAmount,
    });

    // First year calculations
    for (let month = 1; month < 13; month++) {
      const interest = Math.round(
        (baseAmount * currentInterestRate * month) / 1200
      );
      schedule.push({
        date: dates[month],
        interest,
        totalPayable: baseAmount + interest,
      });
    }

    // Update base amount for next year
    baseAmount = schedule[12].totalPayable;

    // Second year calculations
    for (let month = 13; month < dates.length; month++) {
      const monthsFromApril = month - 12;
      const interest = Math.round(
        (baseAmount * currentInterestRate * monthsFromApril) / 1200
      );
      schedule.push({
        date: dates[month],
        interest,
        totalPayable: baseAmount + interest,
      });
    }

    return schedule;
  };
  const processData = (data) => {
    try {
      const historicalData = calculateHistoricalData(data);
      const schedules = {
        8.33: calculatePaymentSchedule(
          historicalData["8.33"].yearlyData["2023-24"].total
        ),
        1.16: calculatePaymentSchedule(
          historicalData["1.16"].yearlyData["2023-24"].total
        ),
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

  // Sample data for initial render
  const sampleData = [
    {
      "Wage Month (all the months from date of joining to date of leaving)":
        "1/2013",
      "Wages on which PF contribution was paid": "25000",
    },
    {
      "Wage Month (all the months from date of joining to date of leaving)":
        "2/2013",
      "Wages on which PF contribution was paid": "25000",
    },
    {
      "Wage Month (all the months from date of joining to date of leaving)":
        "3/2013",
      "Wages on which PF contribution was paid": "25000",
    },
  ];

  // Initialize with sample data
  React.useEffect(() => {
    processData(sampleData);
  }, []);

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
                      <th className="px-4 py-2 text-right">Interest Rate</th>
                      <th className="px-4 py-2 text-right">8.33%</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-right">1.16%</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      results.historicalData["8.33"].yearlyData
                    ).map(([fy, data833]) => {
                      const data116 =
                        results.historicalData["1.16"].yearlyData[fy];
                      return (
                        <tr key={fy} className="border-t">
                          <td className="px-4 py-2">{fy}</td>
                          <td className="px-4 py-2 text-right">
                            {getInterestRateForYear(fy)}%
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data833.difference.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data833.interest.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data833.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data116?.contribution.toLocaleString() || "0"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data116?.interest.toLocaleString() || "0"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {data116?.total.toLocaleString() || "0"}
                          </td>
                        </tr>
                      );
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

export default PreviewPensionCalculator;
