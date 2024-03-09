import time

def sleeps(func):
    def wrapper(*args,**kwargs):
        time.sleep(3)
        result = func(*args,**kwargs)
        return result
    return wrapper

@sleeps
def sum(a,b=5):
    print(a+b)
sum(2,b=10)

