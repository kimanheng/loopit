import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Pressable, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

interface TimePickerProps {
    label: string;
    value: string;
    onChange: (time: string) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Helper to add padding for scrolling
const padData = (data: string[]) => ["", "", ...data, "", ""];

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

export default function TimePicker({ label, value, onChange }: TimePickerProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const { fonts } = useLanguage();
    
    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: '10', minute: '00', period: 'AM' };
        try {
            const timePart = timeStr.includes(', ') ? timeStr.split(', ')[1] : timeStr;
            const [time, period] = timePart.split(' ');
            const [hour, minute] = time.split(':');
            return { 
                hour: parseInt(hour).toString(), 
                minute: minute.padStart(2, '0'), 
                period: period || 'AM' 
            };
        } catch (e) {
            return { hour: '10', minute: '00', period: 'AM' };
        }
    };

    const [selectedHour, setSelectedHour] = useState(parseTime(value).hour);
    const [selectedMinute, setSelectedMinute] = useState(parseTime(value).minute);
    const [selectedPeriod, setSelectedPeriod] = useState(parseTime(value).period);

    const hourListRef = useRef<FlatList>(null);
    const minuteListRef = useRef<FlatList>(null);
    const periodListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (modalVisible) {
            const time = parseTime(value);
            setSelectedHour(time.hour);
            setSelectedMinute(time.minute);
            setSelectedPeriod(time.period);
            
            // Short delay to ensure FlatList is ready
            setTimeout(() => {
                scrollToValue(hourListRef, HOURS, time.hour);
                scrollToValue(minuteListRef, MINUTES, time.minute);
                scrollToValue(periodListRef, PERIODS, time.period);
            }, 100);
        }
    }, [modalVisible, value]);

    const scrollToValue = (ref: React.RefObject<FlatList>, data: string[], val: string) => {
        const index = data.indexOf(val);
        if (index !== -1 && ref.current) {
            ref.current.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: false });
        }
    };

    const handleConfirm = () => {
        onChange(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);
        setModalVisible(false);
    };

    const handleScroll = (data: string[], setter: (val: string) => void) => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        if (index >= 0 && index < data.length) {
            setter(data[index]);
        }
    };

    const renderColumn = (ref: React.RefObject<FlatList>, data: string[], selectedValue: string, setter: (val: string) => void) => (
        <View style={styles.column}>
            <View style={styles.selectionOverlay} pointerEvents="none" />
            <FlatList
                ref={ref}
                data={padData(data)}
                keyExtractor={(_, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScroll(data, setter)}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                renderItem={({ item, index }) => (
                    <View style={[styles.item, { height: ITEM_HEIGHT }]}>
                        <Text style={[
                            styles.itemText, 
                            { fontFamily: fonts.body },
                            item === selectedValue && styles.selectedText
                        ]}>
                            {item}
                        </Text>
                    </View>
                )}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{label}</Text>
            <TouchableOpacity 
                style={styles.input} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.inputText, { fontFamily: fonts.body }]}>{value || 'Select Time'}</Text>
                <Ionicons name="time-outline" size={20} color={Colors.deepGreen} />
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { fontFamily: fonts.heading }]}>{label}</Text>
                                <Text style={[styles.modalSubtitle, { fontFamily: fonts.body }]}>Scroll to select</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.gray} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.pickerWrapper}>
                            <View style={styles.highlightBar} pointerEvents="none" />
                            <View style={styles.columnsContainer}>
                                {renderColumn(hourListRef, HOURS, selectedHour, setSelectedHour)}
                                <Text style={styles.separator}>:</Text>
                                {renderColumn(minuteListRef, MINUTES, selectedMinute, setSelectedMinute)}
                                <View style={{ width: 10 }} />
                                {renderColumn(periodListRef, PERIODS, selectedPeriod, setSelectedPeriod)}
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.previewText, { fontFamily: fonts.body }]}>
                                Selected: <Text style={{ color: Colors.deepGreen, fontWeight: '700' }}>{selectedHour}:{selectedMinute} {selectedPeriod}</Text>
                            </Text>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                <Text style={[styles.confirmText, { fontFamily: fonts.heading }]}>Set Time</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.gray,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    inputText: {
        fontSize: 16,
        color: Colors.black,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        color: Colors.deepGreen,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.gray,
        marginTop: 2,
    },
    closeBtn: {
        backgroundColor: '#f0f0f0',
        padding: 4,
        borderRadius: 20,
    },
    pickerWrapper: {
        height: PICKER_HEIGHT,
        marginVertical: 10,
        position: 'relative',
        justifyContent: 'center',
    },
    highlightBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        backgroundColor: '#f0f9f4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0efec',
    },
    columnsContainer: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
    },
    column: {
        flex: 1,
        height: '100%',
    },
    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    separator: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.deepGreen,
        marginHorizontal: 5,
        paddingBottom: 4,
    },
    item: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 20,
        color: '#ccc',
    },
    selectedText: {
        color: Colors.deepGreen,
        fontSize: 24,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
    },
    previewText: {
        textAlign: 'center',
        fontSize: 16,
        color: Colors.gray,
        marginBottom: 16,
    },
    confirmButton: {
        backgroundColor: Colors.deepGreen,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.deepGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
