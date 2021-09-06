@include('include.header')



	 <section class="section">
		 <div class="container">
		 
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

<form method="POST" action="{{route('create-user')}}">
@csrf
<div class="field is-grouped">
  <p class="control is-expanded">
    <input class="input" name="name" type="text" placeholder="User name">
  </p>
 <p class="control is-expanded">
    <input class="input" name="email" type="email" placeholder="Email">
  </p>
  <p class="control">
    <button class="button is-success">
      Create
    </a>
  </p>
</div>

</form>



<table class="table is-fullwidth">
	<thead>
		<tr>
			<th>Name</th>
			<th>Email</th>
			<th>Password</th>
			<th>Role</th>
			<th>Confirmed</th>
			<th></th>
			<th></th>
			<th></th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($users as $user)
		   <tr>
		   
		   <form method="POST" action="{{route('update-user',['id' => $user->id])}}">
		   					@csrf
					 @method('PUT')
		
				<td>	
					<input class="input" name="name" type="text"  name="name" value="{{ $user->name }}">
				</td>
				
						
				<td>	
					<input class="input" type="email"  name="email" value="{{ $user->email }}">
				</td>
				
				<td>	
					<input class="input" type="password"  name="password">
				</td>
				
				
				<td>	
					<input class="input"  type="text"  name="role" value="{{ $user->role }}">

				</td>

				<td>
					@empty ($user->email_verified_at)
					  <input type="checkbox" name="confirmed">
					@else
					 <input type="checkbox" name="confirmed" checked>
					 @endempty
				</td>


				<td>
					

					 <button class="button is-success">Update</button>
					
				</td>
				 </form>
								<td>
					
						<form method="POST" action="{{route('reset-user',['id' => $user->id])}}">
					@csrf
					 @method('PUT')
				
					 <button class="button is-warning">Reset</button>
					 </form>
					
					

					
					
				</td>
				
				
				<td>
									<form method="POST" action="{{route('delete-user',['id' => $user->id])}}">
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