@include('include.header')



	 <section class="section">
		 <div class="container">
		 <h1 class="title">Users management</h1>
		 @if ($errors->any())
<article class="message is-danger">
  <div class="message-header">
    <p>Error</p>

  </div>
  <div class="message-body">
          <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
</article>

@endif



<table class="table is-fullwidth">
	<thead>
		<tr>
			<th>Name</th>
			<th>Email</th>
			<th>Role</th>

			<th></th>
			<th></th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($users as $user)
		   <tr>
		   
		   <form method="POST" action="{{route('admin-update-user',['id' => $user->id])}}">
		   					@csrf
					 @method('PUT')
		
				<td>	
					<input class="input" name="name" type="text"  name="name" value="{{ $user->name }}">
				</td>
				
						
				<td>	
					<input class="input" type="email"  name="email" value="{{ $user->email }}">
				</td>
				
				
				
				<td>	
					<input class="input"  type="text"  name="role" value="{{ $user->role }}">

				</td>



				<td>
					

					 <button class="button is-success">Update</button>
					
				</td>
				 </form>
				
				
				<td>
									<form method="POST" action="{{route('admin-delete-user',['id' => $user->id])}}">
					@csrf
					 @method('DELETE')
				
					 <button class="button is-danger">Delete</button>
					 </form>
				
				
				</td>
		   </tr>
    @endforeach
	</tbody>
</table>
		 
{{$users->onEachSide(5)->links()}}

    </div>

    </section>



@include('include.footer')