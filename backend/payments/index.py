import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка платежных операций с комиссией 10% при выводе
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id', '1')
            
            cursor.execute(
                "SELECT id, username, balance, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                cursor.execute(
                    "INSERT INTO users (id, username, balance) VALUES (%s, %s, %s) RETURNING id, username, balance, created_at",
                    (user_id, f'user_{user_id}', Decimal('10000.00'))
                )
                user = cursor.fetchone()
                conn.commit()
            
            cursor.execute(
                "SELECT id, type, amount, fee, status, description, created_at FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (user_id,)
            )
            transactions = cursor.fetchall()
            
            cursor.execute("SELECT total_fees FROM admin_fees WHERE id = 1")
            admin_fees = cursor.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'balance': float(user['balance']),
                        'created_at': user['created_at'].isoformat()
                    },
                    'transactions': [
                        {
                            'id': str(t['id']),
                            'type': t['type'],
                            'amount': float(t['amount']),
                            'fee': float(t['fee']) if t['fee'] else 0,
                            'status': t['status'],
                            'description': t['description'],
                            'date': t['created_at'].isoformat()
                        }
                        for t in transactions
                    ],
                    'admin_balance': float(admin_fees['total_fees']) if admin_fees else 0
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_id = body_data.get('user_id', '1')
            amount = Decimal(str(body_data.get('amount', 0)))
            
            if amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid amount'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            if action == 'deposit':
                cursor.execute(
                    "UPDATE users SET balance = balance + %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (amount, user_id)
                )
                cursor.execute(
                    "INSERT INTO transactions (user_id, type, amount, fee, status, description) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, 'deposit', amount, Decimal('0'), 'completed', 'Пополнение счета')
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Deposit successful'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'withdrawal':
                current_balance = user['balance']
                
                if amount > current_balance:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient funds'}),
                        'isBase64Encoded': False
                    }
                
                fee = amount * Decimal('0.1')
                
                cursor.execute(
                    "UPDATE users SET balance = balance - %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (amount, user_id)
                )
                cursor.execute(
                    "INSERT INTO transactions (user_id, type, amount, fee, status, description) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, 'withdrawal', amount, fee, 'completed', 'Вывод на карту')
                )
                cursor.execute(
                    "UPDATE admin_fees SET total_fees = total_fees + %s, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
                    (fee,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Withdrawal successful',
                        'fee': float(fee),
                        'received': float(amount - fee)
                    }),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()
