import React, { useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { UploadCloud } from "lucide-react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

// Historical interest rates by financial year
const HISTORICAL_INTEREST_RATES = {
  "1995-96": 12,
  "1996-97": 12,
  "1997-98": 12,
  "1998-99": 12,
  "1999-00": 12,
  "2000-01": 12,
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

const DownloadButton = ({ data, filename, type }) => {
  const downloadData = () => {
    if (type === "csv") {
      const csvContent = Papa.unparse(data);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "excel") {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  };

  return (
    <button
      onClick={downloadData}
      className="inline-flex items-center px-3 py-1 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
    >
      <Download className="w-4 h-4 mr-2" />
      Download {type.toUpperCase()}
    </button>
  );
};

const DownloadButtons = ({ scheduleData, type }) => {
  const prepareScheduleData = () => {
    return scheduleData.map((row) => ({
      Date: row.date,
      "Opening Balance": row.totalPayable - row.interest,
      Interest: row.interest,
      "Closing Balance": row.totalPayable,
    }));
  };

  return (
    <div className="flex gap-2 mb-4">
      <DownloadButton
        data={prepareScheduleData()}
        filename={`${type}-schedule`}
        type="csv"
      />
      <DownloadButton
        data={prepareScheduleData()}
        filename={`${type}-schedule`}
        type="excel"
      />
    </div>
  );
};

const ScheduleTable = ({ schedule, type }) => {
  const isFinancialYearEnd = (date) => {
    return date.endsWith("-03-2024") || date.endsWith("-03-2025");
  };

  const prepareScheduleData = () => {
    return schedule.map((row) => ({
      Date: row.date,
      "Opening Balance": row.totalPayable - row.interest,
      Interest: row.interest,
      "Closing Balance": row.totalPayable,
    }));
  };

  const downloadCSV = () => {
    const csvContent = Papa.unparse(prepareScheduleData());
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${type}-schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(prepareScheduleData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${type}-schedule.xlsx`);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium">{type} Payment Schedule</h4>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
          <button
            onClick={downloadExcel}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left border-b border-r">Date</th>
              <th className="px-4 py-2 text-right border-b border-r">
                Opening Balance
              </th>
              <th className="px-4 py-2 text-right border-b border-r">
                Interest
              </th>
              <th className="px-4 py-2 text-right border-b">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {schedule?.map((payment, index) => {
              const prevPayment = index > 0 ? schedule[index - 1] : null;
              return (
                <tr
                  key={index}
                  className={`${
                    isFinancialYearEnd(payment.date)
                      ? "bg-gray-50 font-medium"
                      : ""
                  } hover:bg-gray-50`}
                >
                  <td className="px-4 py-2 border-b border-r">
                    {payment.date}
                  </td>
                  <td className="px-4 py-2 text-right border-b border-r">
                    {(index === 0
                      ? payment.totalPayable
                      : prevPayment?.totalPayable
                    ).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border-b border-r">
                    {payment.interest.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border-b">
                    {payment.totalPayable.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Move CombinedScheduleTable from inside PreviewPensionCalculator to here
// Add this after ScheduleTable component and before PreviewPensionCalculator
const CombinedScheduleTable = ({ schedule833, schedule116, fileName }) => {
  // Added fileName here
  const isFinancialYearEnd = (date) => {
    return date.endsWith("-03-2024") || date.endsWith("-03-2025");
  };

  const prepareScheduleData = () => {
    return schedule833.map((row, index) => {
      const row116 = schedule116[index];
      return {
        Date: row.date,
        "Opening Balance 8.33%": row.totalPayable - row.interest,
        "Opening Balance 1.16%": row116.totalPayable - row116.interest,
        "Interest 8.33%": row.interest,
        "Interest 1.16%": row116.interest,
        "Total Closing Balance": row.totalPayable + row116.totalPayable,
      };
    });
  };

  const downloadCSV = () => {
    const csvContent = Papa.unparse(prepareScheduleData());
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Use fileName if available
    const downloadName = fileName
      ? `${fileName}_combined-schedule.csv`
      : "combined-schedule.csv";
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(prepareScheduleData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // Use fileName if available
    const downloadName = fileName
      ? `${fileName}_combined-schedule.xlsx`
      : "combined-schedule.xlsx";
    XLSX.writeFile(wb, downloadName);
  };

  // Rest of the component remains the same

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium">Combined Payment Schedule</h4>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
          <button
            onClick={downloadExcel}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-collapse border-slate-400">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left border border-slate-300">
                Date
              </th>
              <th className="px-4 py-2 text-right border border-slate-300">
                Opening Balance (8.33%)
              </th>
              <th className="px-4 py-2 text-right border border-slate-300">
                Interest (8.33%)
              </th>
              <th className="px-4 py-2 text-right border border-slate-300">
                Opening Balance (1.16%)
              </th>
              <th className="px-4 py-2 text-right border border-slate-300">
                Interest (1.16%)
              </th>
              <th className="px-4 py-2 text-right border border-slate-300">
                Total Closing Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule833.map((payment833, index) => {
              const payment116 = schedule116[index];
              return (
                <tr
                  key={index}
                  className={`${
                    isFinancialYearEnd(payment833.date)
                      ? "bg-gray-50 font-medium"
                      : ""
                  } hover:bg-gray-50`}
                >
                  <td className="px-4 py-2 border border-slate-300">
                    {payment833.date}
                  </td>
                  <td className="px-4 py-2 text-right border border-slate-300">
                    {(
                      payment833.totalPayable - payment833.interest
                    ).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border border-slate-300">
                    {payment833.interest.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border border-slate-300">
                    {(
                      payment116.totalPayable - payment116.interest
                    ).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border border-slate-300">
                    {payment116.interest.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border border-slate-300">
                    {(
                      payment833.totalPayable + payment116.totalPayable
                    ).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PreviewPensionCalculator = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

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
        const interestOnCumulativeBalance = Math.ceil(
          (cumulativeBalance * yearlyInterestRate) / 100
        );

        // Calculate interest on current year's IBB
        const interestOnCurrentYear = Math.ceil(
          (currentYearIBB * yearlyInterestRate) / 1200
        );

        // Total interest for the year is sum of both
        yearData.interest = Math.ceil(
          interestOnCumulativeBalance + interestOnCurrentYear
        );

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
      "31-07-2025"
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
    // Add this line to store filename
    setUploadedFileName(file.name.split(".")[0]);

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
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-collapse border-slate-400">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left border border-slate-300">
                          Year
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          Interest Rate
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          8.33%
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          Interest
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          Total
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          1.16%
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          Interest
                        </th>
                        <th className="px-4 py-2 text-right border border-slate-300">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        results.historicalData["8.33"].yearlyData
                      ).map(([fy, data833]) => {
                        const data116 =
                          results.historicalData["1.16"].yearlyData[fy];
                        return (
                          <tr key={fy} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border border-slate-300">
                              {fy}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {getInterestRateForYear(fy)}%
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data833.difference.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data833.interest.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data833.total.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data116?.contribution.toLocaleString() || "0"}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data116?.interest.toLocaleString() || "0"}
                            </td>
                            <td className="px-4 py-2 text-right border border-slate-300">
                              {data116?.total.toLocaleString() || "0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

              <CombinedScheduleTable
                schedule833={results.schedules["8.33"]}
                schedule116={results.schedules["1.16"]}
                fileName={uploadedFileName}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; // End of PreviewPensionCalculator

export default PreviewPensionCalculator;
