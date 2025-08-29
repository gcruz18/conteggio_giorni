import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Settings, CalendarDays } from 'lucide-react';

const WorkdaysCalculator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [customHolidays, setCustomHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [newHolidayDisplay, setNewHolidayDisplay] = useState('');
  const [isYearlyHoliday, setIsYearlyHoliday] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [results, setResults] = useState(null);
  const [currentView, setCurrentView] = useState('calculator'); // 'calculator' o 'calendar'

  // Calcolo della Pasqua usando l'algoritmo di Gauss
  const calculateEaster = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;
    
    return new Date(year, n - 1, p + 1);
  };

  // Festività fisse italiane
  const getFixedHolidays = (year) => [
    { name: 'Capodanno', date: new Date(year, 0, 1) },
    { name: 'Epifania', date: new Date(year, 0, 6) },
    { name: 'Festa della Liberazione', date: new Date(year, 3, 25) },
    { name: 'Festa del Lavoro', date: new Date(year, 4, 1) },
    { name: 'Festa della Repubblica', date: new Date(year, 5, 2) },
    { name: 'Ferragosto', date: new Date(year, 7, 15) },
    { name: 'Ognissanti', date: new Date(year, 10, 1) },
    { name: 'Festa di Sant\'Ambrogio', date: new Date(year, 11, 7) },
    { name: 'Immacolata Concezione', date: new Date(year, 11, 8) },
    { name: 'Natale', date: new Date(year, 11, 25) },
    { name: 'Santo Stefano', date: new Date(year, 11, 26) }
  ];

  // Festività variabili (Pasqua)
  const getVariableHolidays = (year) => {
    const easter = calculateEaster(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    return [
      { name: 'Pasqua', date: easter },
      { name: 'Lunedì dell\'Angelo', date: easterMonday }
    ];
  };

  // Ottieni tutte le festività per un anno
  const getAllHolidays = (year) => [
    ...getFixedHolidays(year),
    ...getVariableHolidays(year)
  ];

  // Controlla se una data è festiva
  const isHoliday = (date, holidaysInPeriod) => {
    const dateNormalized = new Date(date);
    dateNormalized.setHours(0, 0, 0, 0);
    
    return holidaysInPeriod.some(holiday => {
      const holidayNormalized = new Date(holiday);
      holidayNormalized.setHours(0, 0, 0, 0);
      return holidayNormalized.getTime() === dateNormalized.getTime();
    });
  };

  // Controlla se una data è weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Domenica o Sabato
  };

  // Calcola i giorni lavorativi
  const calculateWorkdays = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert('La data di inizio deve essere precedente alla data di fine');
      return;
    }

    // Raccogli tutte le festività per gli anni nel periodo
    const years = [];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      years.push(year);
    }

    let allHolidays = [];
    years.forEach(year => {
      allHolidays = allHolidays.concat(getAllHolidays(year));
    });

    // Aggiungi festività personalizzate
    let customHolidayDates = [];
    customHolidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      
      if (holiday.isYearly) {
        // Per festività annuali, aggiungi per ogni anno nel periodo
        years.forEach(year => {
          const yearlyDate = new Date(year, holidayDate.getMonth(), holidayDate.getDate());
          if (yearlyDate >= start && yearlyDate <= end) {
            customHolidayDates.push({ name: 'Festività Personalizzata (Annuale)', date: yearlyDate });
          }
        });
      } else {
        // Per festività specifiche, aggiungi solo se nel periodo
        if (holidayDate >= start && holidayDate <= end) {
          customHolidayDates.push({ name: 'Festività Personalizzata', date: holidayDate });
        }
      }
    });
    
    allHolidays = allHolidays.concat(customHolidayDates);

    // Filtra solo le festività nel periodo
    const holidaysInPeriod = allHolidays
      .map(h => h.date)
      .filter(date => date >= start && date <= end);

    let totalDays = 0;
    let weekendDays = 0;
    let holidayDays = 0;
    let workdays = 0;
    
    const holidaysInPeriodInfo = [];
    const current = new Date(start);

    // Assicurati che le date siano al giorno senza orari per confronti corretti
    current.setHours(0, 0, 0, 0);
    const endNormalized = new Date(end);
    endNormalized.setHours(23, 59, 59, 999);

    while (current <= endNormalized) {
      totalDays++;
      
      if (isWeekend(current)) {
        weekendDays++;
      } else if (isHoliday(current, holidaysInPeriod)) {
        holidayDays++;
        const holidayInfo = allHolidays.find(h => {
          const holidayDate = new Date(h.date);
          holidayDate.setHours(0, 0, 0, 0);
          const currentNormalized = new Date(current);
          currentNormalized.setHours(0, 0, 0, 0);
          return holidayDate.getTime() === currentNormalized.getTime();
        });
        if (holidayInfo) {
          holidaysInPeriodInfo.push({
            name: holidayInfo.name,
            date: new Date(current)
          });
        }
      } else {
        workdays++; // Solo giorni che non sono né weekend né festività
      }
      
      current.setDate(current.getDate() + 1);
    }

    setResults({
      totalDays,
      weekendDays,
      holidayDays,
      workdays,
      holidaysInPeriod: holidaysInPeriodInfo
    });
  };

  // Gestisce il cambio della data per festività personalizzate
  const handleNewHolidayChange = (value) => {
    setNewHolidayDisplay(value);
    const parsedDate = parseItalianDate(value);
    if (parsedDate) {
      setNewHoliday(parsedDate.toISOString().split('T')[0]);
    } else {
      setNewHoliday('');
    }
  };

  // Aggiungi festività personalizzata
  const addCustomHoliday = () => {
    if (!newHoliday || !isValidDateFormat(newHolidayDisplay)) {
      alert('Inserisci una data valida nel formato dd/mm/yyyy');
      return;
    }
    
    const holidayData = {
      date: newHoliday,
      displayDate: newHolidayDisplay,
      isYearly: isYearlyHoliday,
      id: Date.now() // ID univoco per la rimozione
    };
    
    // Controlla se la festività non esiste già
    const exists = customHolidays.some(h => 
      h.date === newHoliday && h.isYearly === isYearlyHoliday
    );
    
    if (!exists) {
      setCustomHolidays([...customHolidays, holidayData]);
    }
    setNewHoliday('');
    setNewHolidayDisplay('');
    setIsYearlyHoliday(false);
  };

  // Rimuovi festività personalizzata
  const removeCustomHoliday = (holidayId) => {
    setCustomHolidays(customHolidays.filter(h => h.id !== holidayId));
  };

  // Ricalcola quando cambiano le date o le festività
  useEffect(() => {
    if (startDate && endDate) {
      calculateWorkdays();
    }
  }, [startDate, endDate, customHolidays]);

  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Converte da dd/mm/yyyy a Date object
  const parseItalianDate = (dateString) => {
    if (!dateString || !dateString.includes('/')) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) return null;
    
    const date = new Date(year, month, day);
    // Verifica che la data sia valida (es. 31/02 non è valida)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  // Converte da Date object a dd/mm/yyyy
  const formatItalianDate = (date) => {
    if (!date) return '';
    return formatDateShort(date);
  };

  // Valida e aggiorna la data di inizio
  const handleStartDateChange = (value) => {
    setStartDateDisplay(value);
    const parsedDate = parseItalianDate(value);
    if (parsedDate) {
      setStartDate(parsedDate.toISOString().split('T')[0]); // Formato interno yyyy-mm-dd
    } else {
      setStartDate('');
    }
  };

  // Valida e aggiorna la data di fine
  const handleEndDateChange = (value) => {
    setEndDateDisplay(value);
    const parsedDate = parseItalianDate(value);
    if (parsedDate) {
      setEndDate(parsedDate.toISOString().split('T')[0]); // Formato interno yyyy-mm-dd
    } else {
      setEndDate('');
    }
  };

  // Valida il formato della data
  const isValidDateFormat = (dateString) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    return dateRegex.test(dateString) && parseItalianDate(dateString) !== null;
  };

  // Genera i mesi da visualizzare nel calendario
  const getMonthsInPeriod = () => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= lastMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  // Ottieni il tipo di giorno (workday, weekend, holiday)
  const getDayType = (date, holidaysInPeriod) => {
    if (isWeekend(date)) return 'weekend';
    if (isHoliday(date, holidaysInPeriod)) return 'holiday';
    return 'workday';
  };

  // Genera il calendario per un mese
  const generateCalendarMonth = (monthDate, holidaysInPeriod) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // Primo giorno del mese
    const firstDay = new Date(year, month, 1);
    // Ultimo giorno del mese
    const lastDay = new Date(year, month + 1, 0);
    
    // Trova il primo lunedì della settimana che contiene il primo giorno
    const startCalendar = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    startCalendar.setDate(firstDay.getDate() + mondayOffset);
    
    // Genera 6 settimane di giorni
    const days = [];
    const current = new Date(startCalendar);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = current.getMonth() === month;
        
        // Normalizza le date per confronti corretti
        const currentNormalized = new Date(current);
        currentNormalized.setHours(0, 0, 0, 0);
        const startNormalized = new Date(startDate);
        startNormalized.setHours(0, 0, 0, 0);
        const endNormalized = new Date(endDate);
        endNormalized.setHours(0, 0, 0, 0);
        
        const isInPeriod = currentNormalized >= startNormalized && currentNormalized <= endNormalized;
        
        weekDays.push({
          date: new Date(current),
          isCurrentMonth,
          isInPeriod,
          dayType: isInPeriod && isCurrentMonth ? getDayType(current, holidaysInPeriod) : null
        });
        
        current.setDate(current.getDate() + 1);
      }
      days.push(weekDays);
    }
    
    return days;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Calendar className="text-blue-600" />
          Calcolatore Giorni Lavorativi
        </h1>
        <p className="text-gray-600">
          Calcola i giorni lavorativi considerando weekend e festività italiane
        </p>
        
        {/* Bottoni per cambiare vista */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setCurrentView('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'calculator' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings size={20} />
            Calcoli
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'calendar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!startDate || !endDate}
          >
            <CalendarDays size={20} />
            Calendario
          </button>
        </div>
      </div>

      {/* Selezione Date - sempre visibile */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Seleziona Periodo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data di Inizio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data di Fine
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Vista Calcoli */}
      {currentView === 'calculator' && (
        <div>
          {/* Personalizzazione Festività */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Settings size={20} />
              Personalizza Festività
            </button>

            {showCustomizer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Aggiungi Festività Personalizzate</h3>
                
                <div className="space-y-4 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={addCustomHoliday}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Aggiungi
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="yearlyHoliday"
                      checked={isYearlyHoliday}
                      onChange={(e) => setIsYearlyHoliday(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="yearlyHoliday" className="text-sm text-gray-700">
                      Ripeti ogni anno (es. compleanno, ricorrenza aziendale)
                    </label>
                  </div>
                </div>

                {customHolidays.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Festività Personalizzate:</h4>
                    <div className="space-y-2">
                      {customHolidays.map((holiday) => (
                        <div key={holiday.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="flex-1">
                            <div className="font-medium">
                              {formatDateShort(new Date(holiday.date))}
                            </div>
                            <div className="text-sm text-gray-600">
                              {holiday.isYearly ? 'Ripete ogni anno' : 'Data specifica'}
                            </div>
                          </div>
                          <button
                            onClick={() => removeCustomHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-800 ml-3"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Risultati */}
          {results && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4">Risultati</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.totalDays}</div>
                  <div className="text-sm text-gray-600">Giorni Totali</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{results.weekendDays}</div>
                  <div className="text-sm text-gray-600">Weekend</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{results.holidayDays}</div>
                  <div className="text-sm text-gray-600">Festività</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.workdays}</div>
                  <div className="text-sm text-gray-600">Giorni Lavorativi</div>
                </div>
              </div>

              {results.holidaysInPeriod.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Festività nel Periodo</h3>
                  <div className="bg-white rounded-lg p-4">
                    <div className="space-y-2">
                      {results.holidaysInPeriod.map((holiday, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <span className="font-medium">{holiday.name}</span>
                          <span className="text-gray-600">{formatDate(holiday.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!results && startDate && endDate && (
            <div className="text-center py-8">
              <p className="text-gray-500">Seleziona entrambe le date per vedere i risultati</p>
            </div>
          )}
        </div>
      )}

      {/* Vista Calendario */}
      {currentView === 'calendar' && startDate && endDate && results && (
        <div>
          {/* Legenda */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Legenda</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                <span className="text-sm">Giorni Lavorativi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-200 border border-green-300 rounded"></div>
                <span className="text-sm">Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-200 border border-orange-300 rounded"></div>
                <span className="text-sm">Festività</span>
              </div>
            </div>
          </div>

          {/* Calendario */}
          <div className="space-y-8">
            {getMonthsInPeriod().map((monthDate, monthIndex) => {
              // Calcola le festività per questo mese
              const start = new Date(startDate);
              const end = new Date(endDate);
              
              // Raccogli tutte le festività per il calcolo
              const years = [];
              for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
                years.push(year);
              }

              let allHolidays = [];
              years.forEach(year => {
                allHolidays = allHolidays.concat(getAllHolidays(year));
              });

              // Aggiungi festività personalizzate
              let customHolidayDates = [];
              customHolidays.forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                
                if (holiday.isYearly) {
                  years.forEach(year => {
                    const yearlyDate = new Date(year, holidayDate.getMonth(), holidayDate.getDate());
                    if (yearlyDate >= start && yearlyDate <= end) {
                      customHolidayDates.push({ name: 'Festività Personalizzata (Annuale)', date: yearlyDate });
                    }
                  });
                } else {
                  if (holidayDate >= start && holidayDate <= end) {
                    customHolidayDates.push({ name: 'Festività Personalizzata', date: holidayDate });
                  }
                }
              });
              
              allHolidays = allHolidays.concat(customHolidayDates);
              const holidaysInPeriod = allHolidays.map(h => h.date);
              
              const monthCalendar = generateCalendarMonth(monthDate, holidaysInPeriod);
              
              return (
                <div key={monthIndex} className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {monthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </h3>
                  
                  {/* Intestazioni giorni della settimana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Giorni del calendario */}
                  {monthCalendar.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((day, dayIndex) => {
                        let dayClass = 'h-12 flex items-center justify-center text-sm border rounded';
                        
                        if (!day.isCurrentMonth) {
                          dayClass += ' text-gray-400 bg-gray-50';
                        } else if (!day.isInPeriod) {
                          dayClass += ' text-gray-400 bg-gray-100';
                        } else {
                          switch (day.dayType) {
                            case 'weekend':
                              dayClass += ' bg-green-200 border-green-300 text-green-800';
                              break;
                            case 'holiday':
                              dayClass += ' bg-orange-200 border-orange-300 text-orange-800';
                              break;
                            case 'workday':
                              dayClass += ' bg-white border-gray-300 text-gray-900';
                              break;
                          }
                        }
                        
                        return (
                          <div key={dayIndex} className={dayClass}>
                            {day.date.getDate()}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkdaysCalculator;