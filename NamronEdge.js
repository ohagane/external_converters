const zigbee_herdsman_1 = require('zigbee-herdsman');
const fromZigbee_1 = require('zigbee-herdsman-converters/converters/fromZigbee');
const toZigbee_1 = require('zigbee-herdsman-converters/converters/toZigbee');
const constants = require('zigbee-herdsman-converters/lib/constants');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const { determineEndpoint } = require('zigbee-herdsman-converters/lib/modernExtend');
const modernExtend_1 = require('zigbee-herdsman-converters/lib/modernExtend');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const globalStore = require('zigbee-herdsman-converters/lib/store');
const utils = require('zigbee-herdsman-converters/lib/utils');
const ea = exposes.access;
const e = exposes.presets;
const oneDay_millisec = 60 * 60 * 24 * 1000; // one day in miliseconds

const local = {
    fz: {
        namron_thermostat_edge: {
            cluster: 'hvacThermostat',
            type: ['readResponse', 'attributeReport'],
            convert: (model, msg, publish, options, meta) => {
                const result  = {};
                const data = msg.data;

                //Custom cluster
                if (data[0x8000] !== undefined) {                   // 0x8000  Window_check                    BOOLEAN true
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.window_check = lookup[data[0x8000]];
                }
                if (data[0x8001] !== undefined) {                   // 0x8001  Frost                           BOOLEAN false
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.frost = lookup[data[0x8001]];
                }
                if (data[0x8002] !== undefined) {                   // 0x8002  Window_state                    BOOLEAN false
                    const lookup = { 0: 'Closed', 1: 'Open' };
                    result.window_state = lookup[data[0x8002]];
                }
                if (data[0x8003] !== undefined) {                   // 0x8003  Work_days                       ENUM8   0x00
                    const lookup = { 0: 'Mon-Fri Sat-Sun', 1: 'Mon-Sat Sun', 2: 'No Time Off', 3: 'Time Off' };
                    result.work_days = lookup[data[0x8003]];
                }
                if (data[0x8004] !== undefined) {                   // 0x8004  Sensor_mode                     ENUM8   0x00
                    const lookup = { 0: 'Air', 1: 'Floor', 3: 'External', 6: 'Regulator' };
                    result.sensor_mode = lookup[data[0x8004]];
                }
                if (data[0x8005] !== undefined) {                   // 0x8005  Backlight                       INT8U   0x0A                 
                    result.backlight = [data[0x8005]];
                }
                if (data[0x8006] !== undefined) {                   // 0x8006  Fault                           ENUM8   0x00
                    const lookup = { 0: 'none', 1: 'er1', 2: 'er2', 4: 'er3', 8: 'er4', 16: 'Floor sensor fault', 32: 'External sensor fault', 64: 'er7', 128:  'er8' };
                    result.fault = lookup[data[0x8006]];
                }
                if (data[0x800C] !== undefined) {                   // 0x800C  Abs_min_heat_setpoint_limit_f   INT16S  0x1004            
                    result.abs_min_heat_setpoint_limit_f = [data[0x800C]];
                }
                if (data[0x800D] !== undefined) {                   // 0x800D  Abs_max_heat_setpoint_limit_f   INT16S  0x251C           
                    result.abs_max_heat_setpoint_limit_f = [data[0x800D]];
                }                
                if (data[0x800E] !== undefined) {                   // 0x800E  Abs_min_cool_setpoint_limit_f   INT16S  0x1388            
                    result.abs_min_cool_setpoint_limit_f = [data[0x800E]];
                }                
                if (data[0x800F] !== undefined) {                   // 0x800F  Abs_max_cool_setpoint_limit_f   INT16S  0x28A0         
                    result.abs_max_cool_setpoint_limit_f = [data[0x800F]];
                }                
                if (data[0x8010] !== undefined) {                   // 0x8010  Occupied_cooling_setpoint_f     INT16S  0x1B58           
                    result.occupied_cooling_setpoint_f = [data[0x8010]];
                }                
                if (data[0x8011] !== undefined) {                   // 0x8011  Occupied_heating_setpoint_f     INT16S  0x1B58         
                    result.occupied_heating_setpoint_f = [data[0x8011]];
                }                
                if (data[0x8012] !== undefined) {                   // 0x8012  Local_temperature_f             INT16S  0x410           
                    result.local_temperature_f = [data[0x8012]];
                }   
                if (data[0x8013] !== undefined) {                   // 0x8013  Holiday_temp_set                INT16S  0xBB8
                    result.holiday_temp_set  = [data[0x8013]] / 100;
                }   
                if (data[0x801b] !== undefined) {                  // 0x801B  Holiday_temp_set_f              INT16S  0x1388 
                    result.holiday_temp_set_f = [data[0x801b]];
                }          
                if (data[0x801C] !== undefined) {                   // 0x801C  Regulation_mode                 ENUM8   0x00 // No data recieved
                    const lookup = { 0: 'Off', 1: 'On' };
                    result.regulation_mode = lookup[data[0x801C]];
                }
                if (data[0x801D] !== undefined) {                   // 0x801D  Regulator_percentage            INT16S  0x00                
                    result.regulator_percentage = [data[0x801D]];
                }
                if (data[0x801E] !== undefined) {                   // 0x801E  Summer_winter_switch            BOOLEAN false
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.summer_winter_switch = lookup[data[0x801E]];
                }
                if (data[0x801F] !== undefined) {                   // 0x801F  Vacation_mode                   BOOLEAN false
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.vacation_mode = lookup[data[0x801F]];
                }
                if (data[0x8020] !== undefined) {                   // 0x8020  Vacation_start_date             INT32U  0x00
                    const date_start = new Date(data[0x8020]*86400000); //24h in milliseconds                    
                    result.vacation_start_date = date_start.toLocaleDateString();
                }
                if (data[0x8021] !== undefined) {                   // 0x8021  Vacation_end_date               INT32U  0x00
                    const date_end = new Date(data[0x8021]*86400000); //24h in milliseconds
                    result.vacation_end_date = date_end.toLocaleDateString(); 
                }   
                if (data[0x8022] !== undefined) {                   // 0x8022  Auto_time                       BOOLEAN false
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.auto_time = lookup[data[0x8022]];
                }
                if (data[0x8023] !== undefined) {                   // 0x8023  Countdown_set                   ENUM8   0x00
                    const lookup = { 0: 'Off', 1: '5min', 2: '10min', 3: '15min', 4: '20min', 5: '25min', 6: '30min', 7: '35min', 8: '40min', 9: '45min', 10: '50min', 11: '55min', 12: '1 hour',
                    13: '1h5min', 14: '1h10min', 15: '1h15min', 16: '1h20min', 17: '1h25min', 18: '1h30min', 19: '1h35min', 20: '1h40min', 21: '1h45min', 22: '1h50min', 23: '1h55min', 24: '2 hours' };
                    result.countdown_set = lookup[data[0x8023]];
                }
                if (data[0x8024] !== undefined) {                   // 0x8024  Countdown_left                  INT16S  0x00              
                    result.countdown_left = [data[0x8024]];
                }
                return result;
            },
        },
    },
    tz: {
        namron_thermostat_edge: {
            key: [
                
                'window_check', 
                'frost', 
                'window_state', 
                'work_days', 
                'sensor_mode', 
                'backlight',  
                'fault', 
                'regulator',  
                'time_sync_flag',
                'time_sync_value',
                'abs_min_heat_setpoint_limit_f',
                'abs_max_heat_setpoint_limit_f',
                'abs_min_cool_setpoint_limit_f',
                'abs_max_cool_setpoint_limit_f',
                'occupied_cooling_setpoint_f',
                'occupied_heating_setpoint_f',
                'local_temperature_f', 
                'holiday_temp_set', 
                'holiday_temp_set_f',
                'regulator_mode',
                'regulator_percentage',
                'summer_winter_switch',
                'vacation_mode',
                'vacation_start_date',
                'vacation_end_date',
                'auto_time',
                'countdown_set',
                'countdown_left',
            ],
            convertSet: async(entity, key, value, meta) => {

                // Custom Cluster 0x8000
                if (key === 'window_check') {                       // 0x8000  Window_check                     BOOLEAN true
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x8000: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'frost') {                         // 0x8001  Frost                            BOOLEAN false
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x8001: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'window_state') {                  // 0x8002  Window_state                     BOOLEAN false
                    const lookup = {'Closed': 0, 'Open': 1};
                    const payload = {0x8002: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'work_days') {                     // 0x8003  Work_days                        ENUM8   0x00
                    const lookup = {'Mon-Fri Sat-Sun': 0, 'Mon-Sat Sun': 1, 'No Time Off': 2, 'Time Off': 3};
                    const payload = {0x8003: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.ENUM8}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'sensor_mode') {                   // 0x8004  Sensor_mode                      ENUM8   0x00
                    const lookup = {'Air': 0, 'Floor': 1, 'External': 3, 'Regulator': 6};
                    const payload = {0x8004: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.ENUM8}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'backlight') {                     // 0x8005  Backlight                        INT8U   0x0A
                    const payload = {0x8005: {value: value, type: zigbee_herdsman_1.Zcl.DataType.UINT8}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'fault') {                         // 0x8006  Fault                            ENUM8   0x00
                    const lookup = { 'none': 0, 'er1': 1, 'er2': 2, 'er3':4, 'er4':8 , 'Floor sensor fault': 16, 'External sensor fault': 32, 'er7': 64, 'er8': 128 };
                    const payload = {0x8006: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.ENUM8}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'regulator') {                     // 0x8007  Regulator                        INT8U   0x00
                    const payload = {0x8007: {value: value, type: zigbee_herdsman_1.Zcl.DataType.UINT8}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'time_sync_flag') {                // 0x800A  Time_sync_flag                   BOOLEAN false
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x800A: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload );
                }
                else if (key === 'time_sync_value') {               // 0x800B  Time_sync_value                  INT32U  0x00
                    const payload = {0x800B: {value: value, type: zigbee_herdsman_1.Zcl.DataType.UINT32}};
                    await entity.write('hvacThermostat', payload);
                }  
                else if (key === 'abs_min_heat_setpoint_limit_f') { //0x800C  Abs_min_heat_setpoint_limit_f     INT16S  0x1004
                    const payload = {0x800C: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'abs_max_heat_setpoint_limit_f') { // 0x800D  Abs_max_heat_setpoint_limit_f    INT16S  0x251C
                    const payload = {0x800D: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }                
                else if (key === 'abs_min_cool_setpoint_limit_f') { // 0x800E  Abs_min_cool_setpoint_limit_f    INT16S   0x1388
                    const payload = {0x800E: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }                
                else if (key === 'abs_max_cool_setpoint_limit_f') { // 0x800F  Abs_max_cool_setpoint_limit_f    INT16S  0x28A0
                    const payload = {0x800F: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }                
                else if (key === 'occupied_cooling_setpoint_f') { // 0x8010  Occupied_cooling_setpoint_f        INT16S  0x1B58
                    const payload = {0x8010: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }                
                else if (key === 'occupied_heating_setpoint_f') { // 0x8011  Occupied_heating_setpoint_f        INT16S  0x1B58
                    const payload = {0x8011: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }                
                else if (key === 'local_temperature_f') {         // 0x8012  Local_temperature_f                INT16S  0x410
                    const payload = {0x8012: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'holiday_temp_set') {            // 0x8013  Holiday_temp_set                   INT16S  0xBB8   
                    const new_value = value * 100;            
                    const payload = {0x8013: {value: new_value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'holiday_temp_set_f') {          // 0x801B  Holiday_temp_set_f                 INT16S  0x1388
                    const payload = {0x801B: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'regulation_mode') {            // 0x801C  Regulation_mode                     ENUM8   0x00
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x801C: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.ENUM8}};
                    await entity.write('hvacThermostat', payload );
                }
                else if (key === 'regulator_percentage') {       // 0x801D  Regulator_percentage                INT16S  0x00
                    const payload = {0x801D: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }    
                else if (key === 'summer_winter_switch') {       // 0x801E  Summer_winter_switch                BOOLEAN false
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x801E: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }           
                if (key === 'vacation_mode') {                   // 0x801F  Vacation_mode                       BOOLEAN false
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x801f: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'vacation_start_date') {        // 0x8020  Vacation_start_date                 INT32U  0x00 
                    const start_date_int = new Date(value);  
                    const new_value = start_date_int / 86400000 + 1; //24h in milliseconds
                    const payload = {0x8020: {value: new_value, type: zigbee_herdsman_1.Zcl.DataType.UINT32}};
                    await entity.write('hvacThermostat', payload);    
                }
                else if (key === 'vacation_end_date') {          // 0x8021  Vacation_end_date                   INT32U  0x00
                    const end_date_int = new Date(value); 
                    const new_value = end_date_int / 86400000 + 1; //24h in milliseconds
                    const payload = {0x8021: {value: new_value, type: zigbee_herdsman_1.Zcl.DataType.UINT32}};
                    await entity.write('hvacThermostat', payload);
                }  
                else if (key === 'auto_time') {                  // 0x8022  Auto_time                           BOOLEAN false 
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x8022: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }    
                else if (key === 'countdown_set') {              // 0x8023  Countdown_set                       ENUM8   0x00
                    const lookup = {'Off': 0, '5min': 1, '10min': 2, '15min': 3, '20min': 4, '25min': 5, '30min': 6, '35min': 7, '40min': 8, '45min': 9, '50min': 10, '55min': 11, '1 hour': 12,
                        '1h5min': 13, '1h10min': 14, '1h15min': 15, '1h20min': 16, '1h25min': 17, '1h30min': 18, '1h35min': 19, '1h40min': 20, '1h45min': 21, '1h50min': 22, '1h55min': 23, '2 hours': 24};
                    const payload = {0x8023: {value: utils.getFromLookup(value, lookup), type: zigbee_herdsman_1.Zcl.DataType.ENUM8}};
                    await entity.write('hvacThermostat', payload );
                }       
                else if (key === 'countdown_left') {             // 0x8024  Countdown_left                      INT16S  0x00
                    const payload = {0x8024: {value: value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }       
             
            },
            convertGet: async (entity, key, meta) => {
                switch (key) {
  
                // Custom Cluster 0x8000    
                case 'window_check':   
                    await entity.read('hvacThermostat', [0x8000]);
                    break;
                case 'frost':   
                    await entity.read('hvacThermostat', [0x8001]);
                    break;
                case 'window_state':   
                    await entity.read('hvacThermostat', [0x8002]);
                    break;
                case 'work_days':   
                    await entity.read('hvacThermostat', [0x8003]);
                    break;
                case 'sensor_mode':   
                    await entity.read('hvacThermostat', [0x8004]);
                    break;
                case 'backlight':   
                    await entity.read('hvacThermostat', [0x8005]);
                    break;
                case 'fault':   
                    await entity.read('hvacThermostat', [0x8006]);
                    break;
                case 'regulator':   
                    await entity.read('hvacThermostat', [0x8007]);
                    break;
                case 'time_sync_flag':   
                    await entity.read('hvacThermostat', [0x800A]);
                    break;
                case 'time_sync_value':   
                    await entity.read('hvacThermostat', [0x800B]);
                    break;
                case 'abs_min_heat_setpoint_limit_f':   
                    await entity.read('hvacThermostat', [0x800C]);
                    break;
                case 'abs_max_heat_setpoint_limit_f':   
                    await entity.read('hvacThermostat', [0x800D]);
                    break;
                case 'abs_min_cool_setpoint_limit_f':   
                    await entity.read('hvacThermostat', [0x800E]);
                    break;
                case 'abs_max_cool_setpoint_limit_f':   
                    await entity.read('hvacThermostat', [0x800F]);
                    break;                    
                case 'occupied_cooling_setpoint_f':   
                    await entity.read('hvacThermostat', [0x8010]);
                    break; 
                case 'occupied_heating_setpoint_f':   
                    await entity.read('hvacThermostat', [0x8011]);
                    break; 
                case 'local_temperature_f':   
                    await entity.read('hvacThermostat', [0x8012]);
                    break; 
                case 'holiday_temp_set':   
                    await entity.read('hvacThermostat', [0x8013]);
                    break; 
                case 'holiday_temp_set_f':   
                    await entity.read('hvacThermostat', [0x801B]);
                    break; 
                case 'regulation_mode':   
                    await entity.read('hvacThermostat', [0x801C]);
                    break; 
                case 'regulator_percentage':   
                    await entity.read('hvacThermostat', [0x801D]);
                    break; 
                case 'summer_winter_switch':   
                    await entity.read('hvacThermostat', [0x801E]);
                    break; 
                case 'vacation_mode':   
                    await entity.read('hvacThermostat', [0x801F]);
                    break; 
                case 'vacation_start_date':   
                    await entity.read('hvacThermostat', [0x8020]);
                    break;
                case 'vacation_end_date':   
                    await entity.read('hvacThermostat', [0x8021]);
                    break;
                case 'auto_time':   
                    await entity.read('hvacThermostat', [0x8022]);
                    break;    
                case 'countdown_set':   
                    await entity.read('hvacThermostat', [0x8023]);
                    break;
                case 'countdown_left':   
                    await entity.read('hvacThermostat', [0x8024]);
                    break;
                default: // Unknown key
                    throw new Error(`Unhandled key local.tz.namron_thermostat_new.convertGet ${key}`);
                }
            },
        },
    }
};
const definitions = [
    {
        zigbeeModel: ['4512783', '4512784'],
        model: '4512783',
        vendor: 'Namron',
        description: 'Namron Edge',
        fromZigbee: [
            fromZigbee_1.thermostat,
            local.fz.namron_thermostat_edge,
            fromZigbee_1.metering,
            fromZigbee_1.electrical_measurement, 
            fromZigbee_1.namron_hvac_user_interface
        ],
        toZigbee: [
            toZigbee_1.thermostat_local_temperature,
            toZigbee_1.thermostat_min_heat_setpoint_limit,
            toZigbee_1.thermostat_max_heat_setpoint_limit,
            toZigbee_1.thermostat_local_temperature_calibration,
            toZigbee_1.thermostat_occupied_heating_setpoint,
            toZigbee_1.thermostat_temperature_display_mode,
            toZigbee_1.thermostat_system_mode,
            toZigbee_1.thermostat_running_mode,
            //toZigbee_1.thermostat_running_state,          
            toZigbee_1.namron_thermostat_child_lock,
            local.tz.namron_thermostat_edge,
        ],
exposes: [
            // Humidity
            e.humidity(),
            // Thermostat
            e.climate()                
                .withLocalTemperature()
                .withSetpoint('occupied_heating_setpoint', 5, 35, 0.5)
                .withLocalTemperatureCalibration(-10, 10, 0.5)
                .withSystemMode(['off', 'cool', 'heat'])
                .withRunningState(['cool', 'heat', 'idle']),
                //.withPiHeatingDemand(), 
            
            // hvacUserInterface
            e.binary('child_lock', ea.ALL, 'LOCK', 'UNLOCK')
                .withDescription('Enables/disables physical input on the device'),
            e.enum('temperature_display_mode', ea.ALL, ['celsius', 'fahrenheit'])
                .withLabel('Temperature Unit')
                .withDescription('Select Unit'), 
            //// Metering
                e.power(), 
                e.current(), 
                e.energy(),           

        // From Custom Cluster
            // Error
            e.enum('fault', ea.STATE_GET, ['none', 'er1', 'er2', 'er3', 'er4', 'Floor sensor fault', 'External sensor fault', 'er7', 'er8'])
                .withDescription('Check display for more info.'),

            // Functions
            e.binary('window_check', ea.ALL, 'ON', 'OFF')
                .withDescription('Detect temperature drop, and stops operation'),
            e.binary('frost', ea.ALL, 'ON', 'OFF')
                .withDescription('Set Anti-Frost Mode'),
            e.binary('window_state', ea.STATE_GET, 'Closed', 'Open')
                .withDescription('Display Open Window icon on display'),
            e.enum('work_days', ea.STATE_GET, ['Mon-Fri Sat-Sun', 'Mon-Sat Sun', 'No Time Off', 'Time Off']), //not able to change this setting, set to read only
            e.numeric('backlight', ea.ALL)
                .withValueMin(0).withValueMax(100).withValueStep(5)
                .withUnit('%'),
            e.binary('auto_time', ea.ALL, 'ON', 'OFF'),
            //e.numeric('time_sync_value', ea.STATE_GET), // only used by onEvent

            // Mode select 
            e.enum('sensor_mode', ea.ALL, ['Air', 'Floor', 'External', 'Regulator'])
                .withLabel('Sensor control')
                .withDescription('Floor or external only works if sensors are installed'),
            e.numeric('regulator_percentage', ea.ALL)
                .withUnit('%')
                .withValueMax(100)
                .withValueMin(0)
                .withValueStep(10),

            // Boost mode
            e.enum('countdown_set', ea.ALL, ['Off', '5min', '10min', '15min', '20min', '25min', '30min', '35min', '40min', '45min', '50min', '55min', '1 hour',
                        '1h5min', '1h10min', '1h15min', '1h20min', '1h25min', '1h30min', '1h35min', '1h40min', '1h45min', '1h50min', '1h55min', '2 hours'])
                .withLabel('Boost Mode Time'),
            e.numeric('countdown_left', ea.STATE_GET)
                .withLabel('Boost mode remaining time')
                .withUnit('minutes'),
            
            // Vacation/Holiday mode
            e.binary('vacation_mode', ea.ALL, 'ON', 'OFF')
                .withLabel('Holiday mode')
                .withDescription('Displays a "Palmtree" in display when on. If set date is in future the "Palmtree is dimmed until set date is reached.'),                
            e.numeric('holiday_temp_set', ea.ALL)
                .withValueMin(5)
                .withValueMax(35)
                .withValueStep(0.5)
                .withLabel('Holiday temperature setpoint'),           
            e.text('vacation_start_date', ea.ALL)
                .withLabel('Holiday start date')
                .withDescription('Start date in MM/DD/YYYY format'),
            e.text('vacation_end_date', ea.ALL)
            .withLabel('Holiday end date')
                .withDescription('End date in MM/DD/YYYY format'),

            // Unknown stuff 
            //e.numeric('regulator', ea.ALL),    
            //e.binary('time_sync_flag', ea.STATE_GET, 'ON', 'OFF'),
            //e.numeric('abs_min_heat_setpoint_limit_f', ea.STATE_GET),
            //e.numeric('abs_max_heat_setpoint_limit_f', ea.STATE_GET),
            //e.numeric('abs_min_cool_setpoint_limit_f', ea.STATE_GET),
            //e.numeric('abs_max_cool_setpoint_limit_f', ea.STATE_GET),
            //e.numeric('occupied_cooling_setpoint_f', ea.STATE_GET),
            //e.numeric('occupied_heating_setpoint_f', ea.STATE_GET),
            //e.numeric('local_temperature_f', ea.STATE_GET),
            //e.numeric('holiday_temp_set_f', ea.STATE_GET),
            //e.enum('regulator_mode', ea.STATE_GET, ['ON', 'OFF']), // unsure of values coming from unit        
            //e.binary('summer_winter_switch', ea.ALL, 'ON', 'OFF'), //can't find this in unit menu??

        
        ],
        onEvent: async (type, data, device, options) => {
            const endpoint = device.getEndpoint(1);
            if (type === 'stop') {
                clearInterval(globalStore.getValue(device, 'time_sync_value'));
                globalStore.clearValue(device, 'time_sync_value');
            }
            else if (!globalStore.hasValue(device, 'time_sync_value')) {
                const hours24 = 1000 * 60 * 60 * 24;
                const interval = setInterval(async () => {
                    try {
                        // Device does not asks for the time with binding, therefore we write the time every 24 hours
                        const time = new Date().getTime();
                        const value = time / 1000; // removing milliseconds
                        await endpoint.write('hvacThermostat', { 0x800b: {value: value, type: zigbee_herdsman_1.Zcl.DataType.UINT32}} );         
                    }
                    catch {
                        /* Do nothing*/
                    }
                }, hours24);
                globalStore.putValue(device, 'time_sync_value', interval);
                            
            }
        },
     
        configure: async (device, coordinatorEndpoint, logger) => {
            
            const endpoint = device.getEndpoint(1);
            const binds = [
                'genBasic',
                'genIdentify',
                'hvacThermostat',
                'seMetering',
                'haElectricalMeasurement',              
                'hvacUserInterfaceCfg',
            ];
            await reporting.bind(endpoint, coordinatorEndpoint, binds);
            await reporting.thermostatTemperature(endpoint, { min: 0, change: 50 });
            // await reporting.thermostatPIHeatingDemand(endpoint);
            await reporting.thermostatOccupiedHeatingSetpoint(endpoint);
            await reporting.thermostatKeypadLockMode(endpoint);
            //Metering
            await endpoint.read('haElectricalMeasurement', ['acCurrentDivisor', 'rmsCurrent', 'activePower']);
            await endpoint.read('seMetering', ['currentSummDelivered']);
            await reporting.rmsCurrent(endpoint, {min: 10, change: 10}); // A - z2m displays only the first decimals, so change of 10 (0,01)
            await reporting.activePower(endpoint, {min: 10, change: 15}); // W - Min change of 1,5W
            await reporting.currentSummDelivered(endpoint, {min: 300}); // Report KWH every 5min
            await reporting.readMeteringMultiplierDivisor(endpoint);
                       
            
            // Trigger initial read
            await endpoint.read('hvacThermostat', ['systemMode', 'runningState', 'occupiedHeatingSetpoint', 'programingOperMode', 'localTemperatureCalibration']);
            await endpoint.read('hvacUserInterfaceCfg', ['tempDisplayMode', 'keypadLockout']);
            await endpoint.read('hvacThermostat', [0x8000], [0x8001], [0x8002], [0x8003], [0x8004], [0x8005], [0x8006], [0x8007], 
                                                [0x800a], [0x800b], [0x800c], [0x800d], [0x800e], [0x800f], 
                                                [0x8010], [0x8011], [0x8012], [0x8013], 
                                                [0x801b], [0x801c], [0x801d], [0x801e], [0x801f], 
                                                [0x8020], [0x8021], [0x8022], [0x8023], [0x8024], 
                                            );
            device.powerSource = 'Mains (single phase)';
            device.save();
        },
    },
];

module.exports = definitions;
//# sourceMappingURL=namron.js.map