import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase';
  amount: number;
  fee?: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

const Index = () => {
  const [balance, setBalance] = useState(10000);
  const [adminBalance, setAdminBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 5000,
      status: 'completed',
      date: new Date(Date.now() - 86400000).toLocaleString('ru-RU'),
      description: 'Пополнение счета'
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 2000,
      fee: 200,
      status: 'completed',
      date: new Date(Date.now() - 172800000).toLocaleString('ru-RU'),
      description: 'Вывод на карту'
    }
  ]);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      status: 'completed',
      date: new Date().toLocaleString('ru-RU'),
      description: 'Пополнение счета'
    };

    setBalance(prev => prev + amount);
    setTransactions(prev => [newTransaction, ...prev]);
    setDepositAmount('');
    toast.success(`Счет пополнен на ${amount.toLocaleString('ru-RU')} ₽`);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    if (amount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    const fee = amount * 0.1;
    const totalDeduction = amount;
    const userReceives = amount - fee;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      fee,
      status: 'completed',
      date: new Date().toLocaleString('ru-RU'),
      description: 'Вывод на карту'
    };

    setBalance(prev => prev - totalDeduction);
    setAdminBalance(prev => prev + fee);
    setTransactions(prev => [newTransaction, ...prev]);
    setWithdrawAmount('');
    toast.success(`Выведено ${userReceives.toLocaleString('ru-RU')} ₽ (комиссия ${fee.toLocaleString('ru-RU')} ₽)`);
  };

  const handleSupport = () => {
    if (!supportMessage.trim()) {
      toast.error('Введите сообщение');
      return;
    }

    toast.success('Обращение отправлено. Мы ответим в течение 24 часов.');
    setSupportMessage('');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return 'ArrowDownToLine';
      case 'withdrawal': return 'ArrowUpFromLine';
      case 'purchase': return 'ShoppingCart';
      default: return 'CircleDot';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-accent';
      case 'withdrawal': return 'text-destructive';
      case 'purchase': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Wallet" className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PaymentSystem</h1>
                <p className="text-sm text-muted-foreground">Надежные финансовые операции</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Баланс</p>
                <p className="text-2xl font-bold text-foreground">{balance.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Icon name="Wallet" size={20} />
                Текущий баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{balance.toLocaleString('ru-RU')} ₽</p>
              <p className="text-sm text-primary-foreground/80 mt-1">Доступно для операций</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Icon name="ArrowUpFromLine" size={20} />
                Доступно к выводу
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{(balance * 0.9).toLocaleString('ru-RU')} ₽</p>
              <p className="text-sm text-accent-foreground/80 mt-1">После комиссии 10%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Icon name="TrendingUp" size={20} />
                Комиссии (Админ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{adminBalance.toLocaleString('ru-RU')} ₽</p>
              <p className="text-sm text-secondary-foreground/80 mt-1">Накоплено комиссий</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="transactions" className="gap-2">
              <Icon name="List" size={16} />
              Транзакции
            </TabsTrigger>
            <TabsTrigger value="deposit" className="gap-2">
              <Icon name="ArrowDownToLine" size={16} />
              Пополнение
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <Icon name="ArrowUpFromLine" size={16} />
              Вывод
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <Icon name="MessageCircle" size={16} />
              Поддержка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>История операций</CardTitle>
                <CardDescription>Все транзакции по вашему счету</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                          <Icon name={getTransactionIcon(transaction.type)} size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                          {transaction.fee && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Комиссия: {transaction.fee.toLocaleString('ru-RU')} ₽
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${transaction.type === 'deposit' ? 'text-accent' : 'text-destructive'}`}>
                          {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toLocaleString('ru-RU')} ₽
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed' ? 'bg-accent/20 text-accent' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {transaction.status === 'completed' ? 'Выполнено' :
                           transaction.status === 'pending' ? 'В обработке' : 'Отклонено'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle>Пополнение счета</CardTitle>
                <CardDescription>Внесите средства на ваш баланс</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Сумма пополнения</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Введите сумму"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Сумма к зачислению:</span>
                    <span className="font-semibold text-foreground">
                      {depositAmount ? parseFloat(depositAmount).toLocaleString('ru-RU') : '0'} ₽
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Комиссия:</span>
                    <span className="font-semibold text-accent">0 ₽</span>
                  </div>
                </div>
                <Button onClick={handleDeposit} className="w-full" size="lg">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Пополнить счет
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card>
              <CardHeader>
                <CardTitle>Вывод средств</CardTitle>
                <CardDescription>Выведите средства на банковскую карту</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Сумма вывода</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Введите сумму"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма вывода:</span>
                    <span className="font-semibold text-foreground">
                      {withdrawAmount ? parseFloat(withdrawAmount).toLocaleString('ru-RU') : '0'} ₽
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Комиссия (10%):</span>
                    <span className="font-semibold text-destructive">
                      {withdrawAmount ? (parseFloat(withdrawAmount) * 0.1).toLocaleString('ru-RU') : '0'} ₽
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-medium text-foreground">Вы получите:</span>
                    <span className="font-bold text-accent">
                      {withdrawAmount ? (parseFloat(withdrawAmount) * 0.9).toLocaleString('ru-RU') : '0'} ₽
                    </span>
                  </div>
                </div>
                <Button onClick={handleWithdraw} className="w-full" size="lg" variant="destructive">
                  <Icon name="ArrowUpFromLine" size={20} className="mr-2" />
                  Вывести средства
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Поддержка пользователей</CardTitle>
                <CardDescription>Опишите вашу проблему или вопрос</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-message">Сообщение</Label>
                  <Textarea
                    id="support-message"
                    placeholder="Опишите ваш вопрос подробно..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-primary mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Время ответа</p>
                      <p>Мы отвечаем на обращения в течение 24 часов в рабочие дни.</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSupport} className="w-full" size="lg">
                  <Icon name="Send" size={20} className="mr-2" />
                  Отправить обращение
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 PaymentSystem. Все права защищены.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Условия использования</a>
              <a href="#" className="hover:text-foreground transition-colors">Политика конфиденциальности</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
