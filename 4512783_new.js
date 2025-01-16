
const zigbee_herdsman_1 = require('zigbee-herdsman');
const {Zcl} = require('zigbee-herdsman');
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

const hzcelectricsManufacturer = { manufacturerCode: zigbee_herdsman_1.Zcl.ManufacturerCode.SHENZHEN_SHYUGJ_TECHNOLOGY_CO_LTD };

const local = {
    fz: {
        namron_thermostat_edge: {
            cluster: 'hvacThermostat',
            type: ['readResponse', 'attributeReport'],
            convert: (model, msg, publish, options, meta) => {
                const result  = {};
                const data = msg.data;
                

                //Custom cluster

                if (data[0x801f] !== undefined) {                   // 0x801F  Vacation_mode                   BOOLEAN false
                    const lookup = { 0: 'OFF', 1: 'ON' };
                    result.vacation_mode = lookup[data[0x801f]];
                }
                if (data[0x8013] !== undefined) {                   // 0x8013  Holiday_temp_set                INT16S  0xBB8
                    result.holiday_temp_set  = [data[0x8013]] / 100;
                }
                        // if (data[0x801b] !== undefined) {                // 0x801B  Holiday_temp_set_f              INT16S  0x1388 
                        //     // 0x801B Holiday_temp_set_f INT16S 0x1388
                        //     result.holiday_temp_set_f = [data[0x801b]];
                        // }
                if (data[0x8020] !== undefined) {                   // 0x8020  Vacation_start_date             INT32U  0x00
                    const date_start = new Date((data[0x8020]*86400)*1000);                    
                    result.vacation_start_date = date_start.toLocaleDateString();
                }
                if (data[0x8021] !== undefined) {                   // 0x8021  Vacation_end_date               INT32U  0x00
                    const date_end = new Date((data[0x8021]*86400)*1000);
                    result.vacation_end_date = date_end.toLocaleDateString(); 
                    console.log(data[0x8021])
                }   
                
                return result;
            },
        },
    },
    tz: {
        namron_thermostat_edge: {
            key: [
                
                'vacation_mode',
                'holiday_temp_set',
                'vacation_start_date', 
                'vacation_end_date',
            ],
            convertSet: async(entity, key, value, meta) => {

                if (key === 'vacation_mode') {                          // 0x801F  Vacation_mode                   BOOLEAN false
                    const lookup = {'OFF': 0, 'ON': 1};
                    const payload = {0x801f: {value: utils.getFromLookup(value, lookup), type: Zcl.DataType.BOOLEAN}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'holiday_temp_set') {                  // 0x8013  Holiday_temp_set                INT16S  0xBB8   
                    const new_value = value * 100;            
                    const payload = {0x8013: {value: new_value, type: zigbee_herdsman_1.Zcl.DataType.INT16}};
                    await entity.write('hvacThermostat', payload);
                }
                else if (key === 'vacation_start_date') {               // 0x8020  Vacation_start_date             INT32U  0x00 
                    const start_date_int = new Date(value);  
                    const new_value = start_date_int / 86400000 + 1;
                    const payload = {0x8020: {value: new_value, type: Zcl.DataType.UINT32}};
                    await entity.write('hvacThermostat', payload);
                
                }
                else if (key === 'vacation_end_date') {                 // 0x8021  Vacation_end_date               INT32U  0x00
                    const end_date_int = new Date(value); 
                    const new_value = end_date_int / 86400000 + 1; 
                    const payload = {0x8021: {value: new_value, type: Zcl.DataType.UINT32}};
                    await entity.write('hvacThermostat', payload);
                }                   
             
            },
            convertGet: async (entity, key, meta) => {
                switch (key) {
                case 'vacation_mode':   
                    await entity.read('hvacThermostat', [0x801f]);
                    break;
                case 'holiday_temp_set':   
                    await entity.read('hvacThermostat', [0x8013]);
                    break;
                case 'vacation_start_date':   
                    await entity.read('hvacThermostat', [0x8020]);
                    break;
                case 'vacation_end_date':   
                    await entity.read('hvacThermostat', [0x8021]);
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
            toZigbee_1.thermostat_min_heat_setpoint_limit,
            toZigbee_1.thermostat_max_heat_setpoint_limit,
            toZigbee_1.thermostat_local_temperature_calibration,
            toZigbee_1.thermostat_occupied_heating_setpoint,
            toZigbee_1.thermostat_temperature_display_mode,
            toZigbee_1.thermostat_system_mode,
            toZigbee_1.thermostat_running_mode,
            //toZigbee_1.thermostat_programming_operation_mode,            
            toZigbee_1.namron_thermostat_child_lock,
            local.tz.namron_thermostat_edge,
        ],
        extend: [
            
            (modernExtend_1.binary)({        // 0x8000  Window_check                    BOOLEAN true
                name: 'window_check',
                valueOn: ['ON', 1],
                valueOff: ['OFF', 0],
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8000, type: Zcl.DataType.BOOLEAN },
                description: 'Enable or Disable Window Check mode',
                                
            }),
            (modernExtend_1.binary)({        // 0x8001  Frost                           BOOLEAN false
                name: 'frost',
                valueOn: ['ON', 1],
                valueOff: ['OFF', 0],
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8001, type: Zcl.DataType.BOOLEAN },
                description: 'Enable or Disable Frost mode',
            }),
            (modernExtend_1.binary)({        // 0x8002  Window_state                    BOOLEAN false
                name: 'window_state',
                valueOn: ['Open', 1],
                valueOff: ['Closed', 0],
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8002, type: Zcl.DataType.BOOLEAN },
                description: 'Window state Open/Closed',
                access: 'STATE_GET',
                entityCategory: 'diagnostic',
            }),
                    //(0, modernExtend_1.enumLookup)({    // 0x8003  Work_days                       ENUM8   0x00
                    //    name: 'work_days',
                    //    lookup: {'Mon-Fri Sat-Sun': 0, 'Mon-Sat Sun': 1, 'No Time Off': 2, 'Time Off': 3 },
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x8003, type: zigbee_herdsman_1.Zcl.DataType.ENUM8 },
                    //    description: 'Schedule set on unit',
                    //    access: 'STATE_GET',
                    //    entityCategory: 'diagnostic',                
                    //}),
            (modernExtend_1.enumLookup)({    // 0x8004  Sensor_mode                     ENUM8   0x00
                name: 'sensor_mode',
                lookup: {'Air': 0, 'Floor': 1, 'External': 3 },
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8004, type: Zcl.DataType.ENUM8 },
                description: 'Select which sensor the thermostat uses to control the room',
            }),
            (modernExtend_1.numeric)({       // 0x8005  Backlight                       INT8U   0x0A
                name: 'backlight',
                unit: '%',
                valueMin: 0,
                valueMax: 100,
                valueStep: 5,
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8005, type: Zcl.DataType.UINT8 },
                description: 'Brightness of the display',
                entityCategory: 'config',
            }),
            (modernExtend_1.enumLookup)({    // 0x8006  Fault                           ENUM8   0x00
                name: 'fault',
                lookup: {'none': 0, 'er1': 1, 'er2': 2, 'er3':4, 'er4':8 , 'Floor sensor fault': 16, 'External sensor fault': 32, 'er7': 64, 'er8': 128},
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8006, type: Zcl.DataType.ENUM8 },
                description: 'Fault code',
                access: 'STATE_GET',
                entityCategory: 'diagnostic',                
            }),
            (0, modernExtend_1.numeric)({     // 0x8007  Regulator                       INT8U   0x00  // No data recieved
                name: 'regulator',
                //unit: '%',
                //valueMin: 0,
                //valueMax: 255,
                //valueStep: 5,
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8007, type: Zcl.DataType.UINT8 },
                description: 'Regulator',
                //access: 'STATE_GET',
                //entityCategory: 'diagnostic',
            }),
                    //(0, modernExtend_1.numeric)({       // 0x800C  Abs_min_heat_setpoint_limit_f   INT16S  0x1004
                    //    name: 'abs_min_heat_setpoint_limit_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x800c, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),
                    //(0, modernExtend_1.numeric)({       // 0x800D  Abs_max_heat_setpoint_limit_f   INT16S  0x251C
                    //    name: 'abs_max_heat_setpoint_limit_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x800d, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),     
                    //(0, modernExtend_1.numeric)({       // 0x800E  Abs_min_cool_setpoint_limit_f   INT16S  0x1388
                    //    name: 'abs_min_cool_setpoint_limit_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x800e, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),
                    //(0, modernExtend_1.numeric)({       // 0x800F  Abs_max_cool_setpoint_limit_f   INT16S  0x28A0
                    //    name: 'abs_max_cool_setpoint_limit_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x800f, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),
                    //(0, modernExtend_1.numeric)({       // 0x8010  Occupied_cooling_setpoint_f     INT16S  0x1B58
                    //    name: 'occupied_cooling_setpoint_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x8010, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),
                    //(0, modernExtend_1.numeric)({       // 0x8011  Occupied_heating_setpoint_f     INT16S  0x1B58
                    //    name: 'occupied_heating_setpoint_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x8011, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),
                    //(0, modernExtend_1.numeric)({       // 0x8012  Local_temperature_f             INT16S  0x410
                    //    name: 'local_temperature_f',
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x8012, type: zigbee_herdsman_1.Zcl.DataType.INT16 },
                    //    description: '',
                    //    entityCategory: 'config',
                    //}),

            (0, modernExtend_1.enumLookup)({       // 0x801C  Regulation_mode                 ENUM8   0x00 // No data recieved
                name: 'regulation_mode',
                lookup: {'0': 0,'1': 1}, 
                cluster: 'hvacThermostat',
                attribute: { ID: 0x801c, type: Zcl.DataType.ENUM8 },
                description: '',
                //access: 'STATE_GET',
                //entityCategory: 'diagnostic',
            }),
            (modernExtend_1.numeric)({       // 0x801D  Regulator_percentage            INT16S  0x00
                name: 'regulator_percentage',
                unit: '%',
                valueMin: 0,
                valueMax: 100,
                valueStep: 10,
                cluster: 'hvacThermostat',
                attribute: { ID: 0x801d, type: Zcl.DataType.INT16 },
                description: '',
                entityCategory: 'config',
            }),
                    //(0, modernExtend_1.binary)({        // 0x801E  Summer_winter_switch            BOOLEAN false
                    //    name: 'summer_winter_switch',
                    //    valueOn: ['ON', 1],
                    //    valueOff: ['OFF', 0],
                    //    cluster: 'hvacThermostat',
                    //    attribute: { ID: 0x801e, type: zigbee_herdsman_1.Zcl.DataType.BOOLEAN },
                    //    description: 'Summer or winter mode',
                    //}),
           
            (modernExtend_1.binary)({        // 0x8022  Auto_time                       BOOLEAN false
                name: 'auto_time',
                valueOn: ['ON', 1],
                valueOff: ['OFF', 0],
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8022, type: Zcl.DataType.BOOLEAN },
                description: 'Enable or Disable auto time sync',
            }),
            (modernExtend_1.enumLookup)({    // 0x8023  Countdown_set                   ENUM8   0x00
                name: 'boost_mode',
                lookup: {'Off': 0,'5min': 1, '10min': 2, '15min': 3, '20min': 4, '25min': 5, '30min': 6, '35min': 7, '40min': 8, '45min': 9, '50min': 10, '55min': 11, '1 hour': 12,
                    '1h5min': 13, '1h10min': 14, '1h15min': 15, '1h20min': 16, '1h25min': 17, '1h30min': 18, '1h35min': 19, '1h40min': 20, '1h45min': 21, '1h50min': 22, '1h55min': 23, '2 hours': 24}, 
                cluster: 'hvacThermostat',
                attribute: { ID: 0x8023, type: Zcl.DataType.ENUM8 },
                description: 'Status of Boost Mode',
                //access: 'STATE_GET',
                //entityCategory: 'diagnostic',
            }),
            (modernExtend_1.numeric)({       // 0x8024  Countdown_left                  INT16S  0x00
                name: 'Boost mode countdown',
                unit: 'minutes',
                cluster: 'hvacThermostat',
                attribute: {ID: 0x8024, type: Zcl.DataType.INT16 },
                description: 'Updates every minute',
                access: 'STATE_GET',
                entityCategory: 'diagnostic',
            }),
        ],
        
        exposes: [
            e.climate()
                
                .withLocalTemperature()
                .withSetpoint('occupied_heating_setpoint', 5, 35, 0.5)
                .withLocalTemperatureCalibration(-10, 10, 0.5)
                .withSystemMode(['off', 'cool', 'heat'])
                .withRunningState(['cool', 'heat', 'idle']),
                //.withPiHeatingDemand(), 
            // e.programming_operation_mode('setpoint'),           
            
            e.binary('child_lock', ea.ALL, 'LOCK', 'UNLOCK')
                .withDescription('Enables/disables physical input on the device'),
            e.enum('temperature_display_mode', ea.ALL, ['celsius', 'fahrenheit'])
                .withLabel('Temperature Unit')
                .withDescription('Select Unit'),

            //// Metering
            e.power(), 
            e.current(), 
            e.energy(),
            
            // Vacation/Holiday mode

            e.binary('vacation_mode', ea.ALL, 'ON', 'OFF')
                .withDescription('Displays a "Palmtree" in display when on. If set date is in future the "Palmtree is dimmed.'),
                
            e.numeric('holiday_temp_set', ea.ALL)
                .withValueMin(5)
                .withValueMax(35)
                .withValueStep(0.5)
                .withLabel('Vacation temperature setpoint'),
            
            e.text('vacation_start_date', ea.ALL)
                .withDescription('Start date in MM/DD/YYYY format'),
            e.text('vacation_end_date', ea.ALL)
                .withDescription('End date in MM/DD/YYYY format'),

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
                        const value = time / 1000; // removing milli seconds
                        await endpoint.write('hvacThermostat', { 0x800b: {value: value, type: 35}} ); 
                        //await endpoint.read('hvacThermostat', [0x800b]);
                        console.log('time sync')
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
            const binds = ['genBasic', 'genIdentify', 'hvacThermostat', 'seMetering', 'haElectricalMeasurement', 'genAlarms', 'hvacUserInterfaceCfg'];
            const converting = ('countdown_left');
            console.log(converting);
            await reporting.bind(endpoint, coordinatorEndpoint, binds);
            await reporting.thermostatTemperature(endpoint, { min: 0, change: 50 });
            // await reporting.thermostatPIHeatingDemand(endpoint);
            await reporting.thermostatOccupiedHeatingSetpoint(endpoint);
            await reporting.thermostatKeypadLockMode(endpoint);
                       
            
            // Trigger initial read
            await endpoint.read('hvacThermostat', ['systemMode', 'runningMode', 'occupiedHeatingSetpoint']);
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